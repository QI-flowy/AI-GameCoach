"""从已有截图继续分析"""
import asyncio, os, json
from models.report import FrameAnalysis, KeyClip, DotaAnalysisReport, AnalysisStatus
from llm.qwen_client import QwenClient
from pipeline.analyzer import STATUSES

TID = 'dota_new_1778407697'
SS_DIR = os.path.join(r'D:\dota-coach\screenshots', TID)
FRAMES_JSON = os.path.join(SS_DIR, 'frames.json')
REPORT_DIR = r'D:\dota-coach\reports'
BATCH = 4
os.makedirs(REPORT_DIR, exist_ok=True)


async def main():
    with open(FRAMES_JSON) as f:
        meta = json.load(f)
    print(f'Loaded {len(meta)} frames')

    qwen = QwenClient()
    s = AnalysisStatus(task_id=TID, status='analyzing')
    STATUSES[TID] = s
    s.total_frames = len(meta)

    # 阵容识别
    radiant_heroes, dire_heroes, lineup_analysis = [], [], ''
    for fm in meta:
        if fm['timestamp'] >= 60:
            try:
                roster = await qwen.analyze_roster(fm['frame_path'])
                radiant_heroes = roster.get('radiant', [])
                dire_heroes = roster.get('dire', [])
                lineup_analysis = roster.get('lineup_analysis', '')
                print(f'Roster: Radiant={radiant_heroes} Dire={dire_heroes}')
            except Exception as e:
                print(f'Roster failed: {e}')
            break

    ctx = {
        'radiant_heroes': radiant_heroes, 'dire_heroes': dire_heroes,
        'known_heroes': {}, 'prev_analysis': None,
        'timeline': [], 'prev_timestamp': -999,
    }
    for h in (radiant_heroes + dire_heroes):
        if h and h != '未知':
            ctx['known_heroes'][h] = ctx['known_heroes'].get(h, 0) + 1

    results = []
    batches = [meta[i:i + BATCH] for i in range(0, len(meta), BATCH)]

    for bi, batch in enumerate(batches):
        for fm in batch:
            try:
                # 历史上下文
                prev_text = ''
                if ctx['prev_analysis']:
                    p = ctx['prev_analysis']
                    ts = p.get('timestamp', 0)
                    prev_text = (
                        '[上帧(%d:%02d)]事件:%s 评分:%d 类型:%s 团战:%s' % (
                            int(ts // 60), int(ts % 60),
                            p.get('key_event', '无') or '无',
                            p.get('rating', 3),
                            p.get('type', '普通') or '普通',
                            (p.get('dimensions', {}).get('teamfight', '') or '')[:60]
                        )
                    )

                heroes_text = ''
                if ctx.get('radiant_heroes') or ctx.get('dire_heroes'):
                    heroes_text = '[阵容]天辉:%s 夜魇:%s(英雄名严格一致)' % (
                        ctx['radiant_heroes'], ctx['dire_heroes']
                    )

                tl_text = ''
                if ctx.get('timeline'):
                    recent = ctx['timeline'][-3:]
                    lines = ['[最近事件]']
                    for e in recent:
                        ets = e.get('timestamp', ctx['prev_timestamp'])
                        lines.append(' +%ds: %s' % (
                            int(ets),
                            (e.get('key_event', '') or '')[:50]
                        ))
                    tl_text = '\n'.join(lines)

                context = (prev_text + ' ' + heroes_text + ' ' + tl_text).strip()
                if not context:
                    context = '第一帧'

                r = await asyncio.wait_for(
                    qwen.analyze_frame(
                        fm['frame_path'], fm.get('prev_thumb'),
                        fm.get('next_thumb'), fm['timestamp'],
                        context,
                    ),
                    90,
                )
                fa = FrameAnalysis(
                    index=fm['index'], timestamp=fm['timestamp'],
                    dimensions=r.get('dimensions', {}),
                    key_event=r.get('key_event'),
                    type=r.get('type'),
                    rating=r.get('rating', 3),
                )
                results.append(fa)
                ctx['prev_analysis'] = fa.model_dump()
                ctx['prev_timestamp'] = fa.timestamp
                if fa.key_event:
                    ctx['timeline'].append(fa.model_dump())
                print('  [%d/%d] r=%d ev=%s' % (fm['index'], len(meta) - 1, fa.rating, fa.key_event or '-'))
            except asyncio.TimeoutError:
                results.append(FrameAnalysis(
                    index=fm['index'], timestamp=fm['timestamp'],
                    dimensions={}, rating=3, error='timeout',
                ))
                print('  [%d] TIMEOUT' % fm['index'])
            except Exception as e:
                results.append(FrameAnalysis(
                    index=fm['index'], timestamp=fm['timestamp'],
                    dimensions={}, rating=3, error=str(e),
                ))
                print('  [%d] ERR: %s' % (fm['index'], e))

        s.frames_done = len(results)
        s.progress = 10 + int(80 * (bi + 1) / len(batches))
        print('Batch %d/%d: %d/%d' % (bi + 1, len(batches), s.frames_done, len(meta)))

    # 总结
    s.status = 'summarizing'
    si = [dict(timestamp=f.timestamp, dimensions=f.dimensions, key_event=f.key_event, rating=f.rating)
          for f in results if not f.error]
    si_key = [x for x in si if x['rating'] in (1, 5) or x.get('key_event')][:30]
    sm = await qwen.generate_summary(si_key or si[:20])

    tl = []
    for r in results:
        if r.rating in (1, 5):
            tl.append(KeyClip(
                timestamp=r.timestamp,
                label='失误' if r.type == 'mistake' else '高光',
                analysis=r.dimensions.get('teamfight', ''),
                frame_index=r.index,
                clip_type=r.type or 'highlight',
            ))

    s.status = 'done'
    s.progress = 100

    report = DotaAnalysisReport(
        task_id=TID, video_duration=meta[-1]['timestamp'] if meta else 0,
        total_frames=len(results), frames=results, timeline=tl,
        summary=sm.get('summary', ''),
        coach_advice=sm.get('coach_advice', []),
        radiant_heroes=radiant_heroes, dire_heroes=dire_heroes,
        lineup_analysis=lineup_analysis,
    )
    rp = os.path.join(REPORT_DIR, '%s.json' % TID)
    with open(rp, 'w', encoding='utf-8') as f:
        f.write(report.model_dump_json(indent=2))

    print('\nDone! %s' % rp)
    print('Frames: %d, Timeline: %d clips' % (report.total_frames, len(report.timeline)))
    print('  http://localhost:8000/api/analysis/%s/status' % TID)
    print('  http://localhost:3000/analysis/%s' % TID)

asyncio.run(main())