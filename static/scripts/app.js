// Replace URL when hosting:
// url: "http://127.0.0.1:5000/"
// url: "https://barilecec.pythonanywhere.com/"

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
                if (response.user_exists) {
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
    $("button[id='add_new_resort']").click(function (event) {
        event.preventDefault(); // Prevent the page from refreshing
        var resort_name = $("input[name='resorts']").val(); // Get the value of the input field
        var resort_price = $("input[name='resort_price']").val(); // Get the value of the input field
        if (!resort_name || !resort_price) {
            alert("Please type a ski resort name and the price.");
            return;
        }
        $.ajax({
            url: "http://127.0.0.1:5000/",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({
                name: resort_name,
                price: resort_price,
                action: "add_new_resort",
                py_add_resort_to_json: false
            }),
            success: function (response) {
                console.log(response)
                if (response.resort_exists) {
                    alert("Ski resort " + response.resort_name + " already exists. Selecting...");
                    // Update the HTML with the new data returned by the server
                    $("#skiresorts").val(response.resort_name);
                    $("input[name='resorts']").val("")
                    $("input[name='resort_price']").val("")
                } else {
                    const js_add_resort_to_json = confirm("Would you like to add the resort " + resort_name + "?");
                    if (js_add_resort_to_json) {
                        $.ajax({
                            url: "http://127.0.0.1:5000/",
                            type: "POST",
                            contentType: "application/json",
                            data: JSON.stringify({
                                name: resort_name,
                                price: resort_price,
                                action: "add_new_resort",
                                py_add_resort_to_json: js_add_resort_to_json
                            }),
                            success: function (response) {
                                console.log(response)  
                                alert("Ski resort " + response.resort_name + " successfully added!");
                                if (!$("#skiresorts option[value='" + response.resort_name + "']").length) {
                                    $("#skiresorts").append("<option value='" + response.resort_name + "'>" + response.resort_name + "</option>");
                                }
                                $("#skiresorts").val(response.resort_name);
                                $("input[name='resorts']").val("")
                                $("input[name='resort_price']").val("")
                            },
                            error: function () {
                                console.error("Error while sending request to the backend");
                            }
                        });
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

