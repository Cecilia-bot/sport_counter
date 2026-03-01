const scrollTopBtn = document.getElementById("scrollTopBtn");
const cardPrivacy = document.getElementById('card-privacy');

function setBtnVisible(visible) {
  if (!scrollTopBtn) return;
  scrollTopBtn.style.opacity = visible ? '1' : '0';
  scrollTopBtn.style.visibility = visible ? 'visible' : 'hidden';
}

function handleScrollEvent() {
  if (cardPrivacy) {
    setBtnVisible(cardPrivacy.scrollTop > 200);
  } else {
    setBtnVisible(window.scrollY > 200);
  }
}

// Attach scroll listener to the appropriate container
if (cardPrivacy) {
  cardPrivacy.addEventListener('scroll', handleScrollEvent);
} else {
  window.addEventListener('scroll', handleScrollEvent);
}

// Ensure button exists before adding click handler
if (scrollTopBtn) {
  scrollTopBtn.addEventListener('click', () => {
    if (cardPrivacy) {
      cardPrivacy.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  // initialize visibility
  handleScrollEvent();
}
