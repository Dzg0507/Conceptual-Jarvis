window.overlayAPI.onDrawHighlight((bounds) => {
  const svg = document.getElementById('highlight-svg');
  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');

  // Calculate the center and radius of the circle to encompass the bounds
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;
  const radius = Math.max(bounds.width, bounds.height) / 2 + 20; // Add some padding

  // Set SVG attributes for the circle
  circle.setAttribute('cx', centerX);
  circle.setAttribute('cy', centerY);
  circle.setAttribute('r', radius);
  circle.setAttribute('class', 'draw-circle');

  // Dynamically set stroke-dasharray for a perfect animation
  const circumference = 2 * Math.PI * radius;
  circle.style.strokeDasharray = `${circumference} ${circumference}`;
  circle.style.strokeDashoffset = circumference;

  // Trigger the animation by setting the offset to 0 after a short delay
  // This ensures the transition from offset=circumference to offset=0 happens
  setTimeout(() => {
    circle.style.transition = 'stroke-dashoffset 0.7s ease-out';
    circle.style.strokeDashoffset = 0;
  }, 10); // A small delay to allow the initial styles to apply

  svg.appendChild(circle);
});
