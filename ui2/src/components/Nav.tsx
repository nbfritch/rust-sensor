export function Nav() {
  return (
    <nav id="app-nav" class="navbar is-link" role="navigation">
      <div class="navbar-brand">
        <div id="history-search" class="navbar-item" style="display: none">
          <input id="date-input" class="input" type="date" />
          <button id="search-button" class="button is-primary">Search</button>
        </div>
        <div id="readingTypeSelect" class="navbar-item" style="display: none">
          <select class="select" value="1" id="selel">
            <option value="1">Temperature</option>
            <option value="2">Humidity</option>
            <option value="3">Luminance</option>
          </select>
        </div>
        <a id="burger" role="button" class="navbar-burger" aria-label="menu" aria-expanded="false"
          data-target="mainNavbar">
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
        </a>
      </div>
      <div id="mainNavbar" class="navbar-menu">
        <div class="navbar-start">
          <a class="navbar-item" href="/">Now</a>
          <div class="navbar-item has-dropdown is-hoverable">
            <a class="navbar-link">Graph</a>
            <div id="nav-dropdown" class="navbar-dropdown">
              <a class="navbar-item" href="/graph#hour">Hour</a>
              <a class="navbar-item" href="/graph#day">Day</a>
              <a class="navbar-item" href="/graph#week">Week</a>
              <a class="navbar-item" href="/graph#month">Month</a>
            </div>
          </div>
          <a class="navbar-item" href="/graph#history">History</a>
        </div>
      </div>
    </nav>
  );
}
