// Appbar yüksekliğine göre body padding ayarı
window.addEventListener("DOMContentLoaded", () => {
  const appbar = document.querySelector(".appbar");
  if (appbar) {
    const height = appbar.offsetHeight;
    document.body.style.paddingTop = height + "px";
  }
});
