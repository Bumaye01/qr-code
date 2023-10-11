// Get all the dropdown elements
var dropdowns = document.querySelectorAll('.dropdown');

// Add click event listener to each dropdown
dropdowns.forEach(function(dropdown) {
  var dropbtn = dropdown.querySelector('.dropbtn');
  var dropdownContent = dropdown.querySelector('.dropdown-content');

  dropbtn.addEventListener('click', function() {
    dropdownContent.classList.toggle('show');
  });
});