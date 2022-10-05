
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

  /* coverity[check_after_deref] */
  if (typeof fileref != "undefined") {
    document.getElementsByTagName("head")[0].appendChild(fileref)
  }
}

function updateLayoutStyle(selectedTheme) {
  var mainWrapper = document.getElementById("mainSectionWrapper");
  var h3Titles = [...document.getElementsByTagName("h3")];
  var header = document.getElementById("layoutHeader");

  if (selectedTheme === "light") {
    mainWrapper.style.backgroundColor = "#fefefe";
    header.style.backgroundColor = "#000";
    h3Titles.map((h3Ele) => { return h3Ele.style.color = "#000"; });
  }
  else if (selectedTheme === "high-contrast") {
    mainWrapper.style.backgroundColor = "#939393";
    header.style.backgroundColor = "#efefef";
    h3Titles.map((h3Ele) => { return h3Ele.style.color = "#000"; });
  } else {
    mainWrapper.style.backgroundColor = "#000";
    header.style.backgroundColor = "#efefef";
    h3Titles.map((h3Ele) => { return h3Ele.style.color = "#fff"; });
  }
}

function changeTheme(val) {
  localStorage.setItem('THEME', val);
  var selectedTheme = val.toLowerCase();
  var themeFileName = `css/${selectedTheme}-theme.css`;
  updateLayoutStyle(selectedTheme);
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
      if (storedTheme === themeValue) {
        optionView += `<option value="${themeValue}" selected>${capitalize(themeValue)}</option>`;
      } else {
        optionView += `<option value="${themeValue}">${capitalize(themeValue)}</option>`;
      }

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