// The home's loading sheet (html[data-boot], set before paint by the layout's boot script; see globals.css): a blank
// drawing sheet over the whole page with "Loading the drawing" where the name will be, so nothing plain shows before
// the stage takes over and nothing gives away what lines up. The stage lifts it once it is ready (a first visit's a
// beat later, so it reads as a splash rather than a flash) and starts with the pieces scattered.
export function Splash() {
  return (
    <div className="splash" aria-hidden="true">
      <div className="splash-sheet kit-registration">
        <div className="splash-mid">
          <svg className="splash-mark" viewBox="0 0 48 48">
            <path pathLength={1} d="M24 2v44M2 24h44" />
            <circle pathLength={1} cx="24" cy="24" r="11" />
          </svg>
          <p className="lab">Loading the drawing</p>
          <span className="boot-bar">
            <i />
          </span>
        </div>
      </div>
    </div>
  );
}
