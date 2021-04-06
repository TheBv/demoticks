const rootStyles = document.documentElement.style;
if (localStorage.getItem("page:main-color") !== null && localStorage.getItem("page:secondary-color") !== null) {
    rootStyles.setProperty("--main-color", localStorage.getItem("page:main-color"));
    rootStyles.setProperty("--secondary-color", localStorage.getItem("page:secondary-color"));
}

function setLocalStorageColors() {
    localStorage.setItem("page:main-color", rootStyles.getPropertyValue("--main-color"));
    localStorage.setItem("page:secondary-color", rootStyles.getPropertyValue("--secondary-color"));
}
