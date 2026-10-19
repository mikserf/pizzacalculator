import { createPortal } from 'react-dom';
import { GAS_JAR, LIFT, OPENING, OUTCOME, Protocol, RHEOLOGY, SPREAD } from '../lib/doughLog';
import type { ProtocolText } from '../lib/doughLogText';
import QrCode from './QrCode';

/** A filled value, or a blank line to write on. */
function Val({ v, w }: { v: string; w?: number }) {
  return v ? (
    <span className="ps-val" style={w ? { minWidth: w } : undefined}>
      {v}
    </span>
  ) : (
    <span className="ps-ln" style={w ? { flex: 'none', width: w } : undefined} />
  );
}

function Box({ on, label }: { on: boolean; label: string }) {
  return (
    <span className="ps-chk">
      <span className={`ps-box${on ? ' ps-box--on' : ''}`} />
      {label}
    </span>
  );
}

interface ProtocolSheetProps {
  p: Protocol;
  t: ProtocolText;
  /** e.g. "6 × 265 g · 66 % vatten · 24 h kall 4 °C" */
  summary: string;
  /** Address of the saved log in Deglabbet (none while unsaved). */
  url?: string;
}

/**
 * Black-and-white A4 print version of the dough log (based on the Vivera Pizza
 * Degprotokoll). Rendered into <body>, outside the app, and only shown when
 * printing with html[data-print="protocol"].
 */
const ProtocolSheet = ({ p, t, summary, url }: ProtocolSheetProps) =>
  createPortal(
    <div className="protocol-sheet" aria-hidden="true">
      <div className="ps-head">
        <div>
          <h1>{t.title}</h1>
          <div className="ps-brand">pizzacalculator.se</div>
          {summary && <div className="ps-summary">{summary}</div>}
        </div>
        <div className="ps-head-fields">
          <div className="ps-f">
            <span>{t.date}</span>
            <Val v={p.date} w={80} />
          </div>
          <div className="ps-f">
            <span>{t.batch}</span>
            <Val v={p.batch} w={56} />
          </div>
          {/* Scan to open this log in Deglabbet (only the owner can see it). */}
          {url ? (
            <div className="ps-qr">
              <QrCode value={url} label={t.qrCaption} light="#fff" dark="#000" className="ps-qr-code" />
              <span>{t.qrCaption}</span>
            </div>
          ) : (
            <div className="ps-qr ps-qr--none">{t.qrUnsaved}</div>
          )}
        </div>
      </div>

      {/* 1 · Recipe */}
      <div className="ps-sec">
        <h2>1 · {t.s1}</h2>
        <div className="ps-two">
          <div className="ps-flour">
            <span>{t.flour1}</span>
            <Val v={p.flour1} />
            <span className="ps-unit">{t.batchNo}</span>
            <Val v={p.flour1Batch} />
            <span>{t.flour2}</span>
            <Val v={p.flour2} />
            <span className="ps-unit">{t.batchNo}</span>
            <Val v={p.flour2Batch} />
            <span>{t.blend}</span>
            <span style={{ gridColumn: '2 / 5', display: 'flex' }}>
              <Val v={p.blend} />
            </span>
          </div>
          <div className="ps-ing">
            <span />
            <span className="ps-colh">{t.weight}</span>
            <span className="ps-colh">{t.pct}</span>
            <span>{t.flour}</span>
            <Val v={p.flourG} />
            <span className="ps-val ps-muted">100</span>
            <span>{t.water}</span>
            <Val v={p.waterG} />
            <Val v={p.waterPct} />
            <span>{t.salt}</span>
            <Val v={p.saltG} />
            <Val v={p.saltPct} />
            <span>{t.yeast}</span>
            <Val v={p.yeastG} />
            <Val v={p.yeastPct} />
          </div>
        </div>
      </div>

      {/* 2 · Temperature & process */}
      <div className="ps-sec">
        <h2>2 · {t.s2}</h2>
        <div className="ps-two">
          <div className="ps-grid2">
            <div className="ps-item"><span>{t.waterTemp}</span><Val v={p.waterTemp} /><span className="ps-unit">°C</span></div>
            <div className="ps-item"><span>{t.doughTemp}</span><Val v={p.doughTemp} /><span className="ps-unit">°C</span></div>
            <div className="ps-item"><span>{t.roomTemp}</span><Val v={p.roomTemp} /><span className="ps-unit">°C</span></div>
            <div className="ps-item"><span>{t.fermentTemp}</span><Val v={p.fermentTemp} /><span className="ps-unit">°C</span></div>
          </div>
          <div className="ps-grid2">
            <div className="ps-item">
              <span>{t.autolyse}</span>
              <Box on={p.autolyse === 'yes'} label={t.yes} />
              <Box on={p.autolyse === 'no'} label={t.no} />
            </div>
            <div className="ps-item"><span>{t.folds}</span><Val v={p.folds} /><span className="ps-unit">{t.foldsUnit}</span></div>
            <div className="ps-item"><span>{t.fermentStart}</span><Val v={p.fermentStart} /><span className="ps-unit">{t.clockUnit}</span></div>
            <div className="ps-item"><span>{t.totalHours}</span><Val v={p.totalHours} /><span className="ps-unit">h</span></div>
          </div>
        </div>
      </div>

      {/* 3 · The two clocks */}
      <div className="ps-sec">
        <h2>
          3 · {t.s3} <span className="ps-hint">{t.s3hint}</span>
        </h2>
        <div className="ps-clocks">
          <div className="ps-clock">
            <div className="ps-t">{t.clock1}</div>
            <div className="ps-scale">
              {GAS_JAR.map((v) => (
                <span key={v} className={p.gasJar === v ? 'ps-on' : ''}>{v}</span>
              ))}
            </div>
            <div className="ps-sub">{t.jarLevel}</div>
            <div className="ps-line-row"><Val v={p.jarLevel} /></div>
          </div>
          <div className="ps-clock">
            <div className="ps-t">{t.clock2}</div>
            <div className="ps-scale">
              {SPREAD.map((v) => (
                <span key={v} className={p.spread === v ? 'ps-on' : ''}>{v}</span>
              ))}
              <span className="ps-scale-unit">cm</span>
            </div>
            <div className="ps-sub">{t.maturity}</div>
            <div className="ps-line-row"><Val v={p.maturity} /></div>
          </div>
        </div>
      </div>

      {/* 4 · Handling */}
      <div className="ps-sec">
        <h2>
          4 · {t.s4} <span className="ps-hint">{t.s4hint}</span>
        </h2>
        <div className="ps-two" style={{ gap: '0 12px' }}>
          <div className="ps-panel">
            <div className="ps-t">{t.rheologyTitle}</div>
            <div className="ps-col">
              {RHEOLOGY.map((k) => (
                <Box key={k} on={p.rheology.includes(k)} label={t.options[k]} />
              ))}
              <span className="ps-sep">
                <Box on={p.jarPhoto} label={t.jarPhoto} />
              </span>
            </div>
          </div>
          <div className="ps-panel">
            <div className="ps-t">{t.openingTitle}</div>
            <div className="ps-grid2" style={{ gap: '5px 10px' }}>
              {OPENING.map((k) => (
                <Box key={k} on={p.opening.includes(k)} label={t.options[k]} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 5 · Result */}
      <div className="ps-sec">
        <h2>5 · {t.s5}</h2>
        <div className="ps-oven">
          <span className="ps-lead">{t.lift}</span>
          <div className="ps-row">
            {LIFT.map((k) => (
              <Box key={k} on={p.lift === k} label={t.options[k]} />
            ))}
          </div>
        </div>
        <div className="ps-oven">
          <span className="ps-lead">{t.outcome}</span>
          <div className="ps-row">
            {OUTCOME.map((k) => (
              <Box key={k} on={p.outcome === k} label={t.options[k]} />
            ))}
          </div>
        </div>
      </div>

      {/* 6 · Notes */}
      <div className="ps-sec">
        <h2>6 · {t.s6}</h2>
        <div className="ps-notes">{p.notes}</div>
      </div>
    </div>,
    document.body,
  );

export default ProtocolSheet;
