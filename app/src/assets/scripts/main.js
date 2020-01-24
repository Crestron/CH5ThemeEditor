
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
  var selctedTheme = val.toLowerCase();
  var themeFileName = `css/${selctedTheme}-theme.css`;
  loadCssFile(themeFileName);
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
function loadJSON(url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.overrideMimeType('application/json');
  xhr.open('GET', url, true);
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      callback(xhr.responseText);
    }
  };
  xhr.send(null);
}
function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}
function getThemeInfo() {
  loadJSON('./manifest/app.manifest.json', function (response) {
    response = JSON.parse(response);
    var optionView = "";
    response.themeName.forEach((item) => {
      var themes = item.split("/");
      var themeValue = themes[themes.length - 1].replace("-theme.css", "");
      optionView += `<option value="${themeValue}">${capitalize(themeValue)}</option>`;
    });
    var getSelect = document.getElementById("changeThemeId");
    getSelect.innerHTML = optionView;
  });
}
getThemeInfo();
setSelectedIndex(storedTheme);

if (storedTheme) {
  changeTheme(storedTheme);
} else {
  changeTheme('Dark');
}