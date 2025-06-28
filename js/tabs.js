document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('.tab');
  const contents = document.querySelectorAll('.tab-content');

  let tHeld = false;
  document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 't') {
      tHeld = true;
    }
    if (tHeld && ['1', '2', '3', '4'].includes(e.key)) {
      const index = parseInt(e.key) - 1;
      if (index >= 0 && index < tabs.length) {
        activateTab(index);
      }
    }
  });

  document.addEventListener('keyup', (e) => {
    if (e.key.toLowerCase() === 't') {
      tHeld = false;
    }
  });

  function activateTab(index) {
    tabs.forEach((tab, i) => {
      tab.classList.toggle('active', i === index);
    });
    contents.forEach((content, i) => {
      content.classList.toggle('active', i === index);
    });
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => {
      activateTab(i);
    });
  });
});
