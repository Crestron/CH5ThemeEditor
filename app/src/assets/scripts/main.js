
function loadCssFile(filename) {
    var themeId = document.getElementById("themeLinkId");
    if (themeId) {
      themeId.parentNode.removeChild(themeId);
    }
    var fileref = document.createElement("link")
    fileref.setAttribute("rel", "stylesheet")
    fileref.setAttribute("type", "text/css")
    fileref.setAttribute("href", filename)
    fileref.setAttribute("id", "themeLinkId")
    if (typeof fileref != "undefined") {
      document.getElementsByTagName("head")[0].appendChild(fileref)
    }
  }

  function changeTheme(val) {
    localStorage.setItem('THEME', val);
    switch (val) {
      case "Dark":
        loadCssFile("css/dark-theme.css");
        break;
      case "Light":
        loadCssFile("css/light-theme.css");
        break;
      case "Contrast":
        loadCssFile("css/high-contrast-theme.css");
        break;
      default:
        console.log("Somthing went wrong");
    }
  }

  var storedTheme = localStorage.getItem('THEME');

  function setSelectedIndex(valsearch) {
    var s = document.getElementById("changeThemeId");
    for (i = 0; i < s.options.length; i++) {
      if (s.options[i].value == valsearch) {
        s.options[i].selected = true;
        break;
      }
    }
    return;
  }

  setSelectedIndex(storedTheme);

  if (storedTheme) {
    changeTheme(storedTheme);
  } else {
    changeTheme('Dark');
  }