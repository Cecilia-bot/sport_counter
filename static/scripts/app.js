$(document).ready(function () {
    $("button[id='select_user']").click(function (event) {
        event.preventDefault(); // Prevent the page from refreshing
        var username = $("input[name='users']").val(); // Get the value of the input field
        if (!username) {
            alert("Please type a username.");
            return;
        }
        $.ajax({
            url: "http://127.0.0.1:5000/",
            type: "POST",
            data: { users: username, action: "select_user" },
            success: function (response) {
                if (response.exists) {
                    // Update the HTML with the new data returned by the server
                    $("#current_user").text(response.user);
                    $("#counter").text(response.counter);
                } else {
                    const createFile = confirm("User " + username + " does not exist. Would you like to create it?");
                    if (createFile) {
                        $.ajax({
                            url: "http://127.0.0.1:5000/",
                            type: "POST",
                            data: { users: username, action: "create_user" },
                            success: function (response) { 
                                alert("User " + response.user + " successfully created!");
                                $("input[name='users']").val(response.user)
                                $("button[id='select_user']").click()
                            },
                            error: function () {
                                console.error("Error while sending request to the backend");
                            }
                        })
                    }
                }
                
            },
            error: function () {
                console.error("Error while sending request to the backend");
            }
        });
    });
    $("button[id='add']").click(function (event) {
        event.preventDefault(); // Prevent the page from refreshing
        var username = $("input[name='users']").val(); 
        if (!username) {
            alert("Please type a username before adding.");
            return;
        }
        $.ajax({
            url: "http://127.0.0.1:5000/",
            type: "POST",
            data: { users: username, action: "add" },
            success: function (response) { 
                // Update the HTML with the new data returned by the server
                if (!response.counter) {
                    alert("You already rode today. You cannot add twice per day.");
                } else {
                    $("#counter").text(response.counter);
                }
            },
            error: function () {
                console.error("Error while sending request to the backend");
            }
        });
    });
});

