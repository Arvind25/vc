$('#submit').click(function() {
	
	var formData = {
		"hostName"     : $('#hostName').val(),
		"authType"     : $('#authType').val()
	};
	
    if( formData.hostName === "" || formData.authType === "" ) {

		alert("It is necessary to input both values");
		return false;

	}

	$.ajax({
		url: "/auth/config/remove",
		type: "POST",
		dataType: "json",
		data: JSON.stringify(formData),
		contentType: "application/json",
		cache: false,
		complete: function() {
			/* called when complete */
			console.log('process complete');
		},

		success: function(data) {
			console.log(data);
			alert('Entry deleted from database successfully');
		},

		error: function() {
			alert('Error while deletion');
		},
	});
})

