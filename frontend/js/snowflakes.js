// Array of snowflake symbols
const snowflakeSymbols = ['❄', '✦', '✧', '✺', '✶', '❅'];

// Variables to control snowfall
let snowfallSpeed = 100; // Frequency of snowflake creation (in milliseconds)
let fallDurationRange = { min: 5, max: 10 }; // Fall speed in seconds

// Function to create a snowflake
function createSnowflake() {
  const snowflake = document.createElement('div');
  snowflake.classList.add('snowflake');

  // Random symbol and size
  const randomSymbol = snowflakeSymbols[Math.floor(Math.random() * snowflakeSymbols.length)];
  snowflake.innerHTML = randomSymbol;
  snowflake.style.fontSize = Math.random() * 10 + 10 + 'px'; // 10px to 20px

  // Random horizontal position
  const position = Math.random() * window.innerWidth + 'px';
  snowflake.style.left = position;

  // Random fall duration
  const fallDuration = Math.random() * (fallDurationRange.max - fallDurationRange.min) + fallDurationRange.min;
  snowflake.style.animationDuration = fallDuration + 's';

  // Append to body
  document.body.appendChild(snowflake);

  // Remove after falling
  setTimeout(() => {
    snowflake.remove();
  }, fallDuration * 1000);
}

// Start snowfall effect
setInterval(createSnowflake, snowfallSpeed);   