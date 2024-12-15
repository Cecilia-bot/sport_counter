$(document).ready(function () {
    $("input[name='users']").click(function () {
        var selectedOption = $(this).val(); // Get the value of the clicked radio button
        $.ajax({
            url: "http://127.0.0.1:5000/",
            type: "POST",
            data: { users: selectedOption, action: "select_user" },
            success: function (response) {
                // Update the HTML with the new data returned by the server
                $("#counter").text(response.counter);
            },
            error: function () {
                console.error("Error while sending request to the backend");
            }
        });
    });
    $("button[name='action']").click(function (event) {
        event.preventDefault(); // Prevent the page from refreshing
        var selectedOption = $("input[name='users']:checked").val(); 
        if (!selectedOption) {
            alert("Please select a user before adding.");
            return;
        }
        $.ajax({
            url: "http://127.0.0.1:5000/",
            type: "POST",
            data: { users: selectedOption, action: "add" },
            success: function (response) { 
                // Update the HTML with the new data returned by the server
                $("#counter").text(response.counter);
            },
            error: function () {
                console.error("Error while sending request to the backend");
            }
        });
    });
});
