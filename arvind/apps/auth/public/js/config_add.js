$('#submit').click(function() {
	var formData = {
		"hostName"     : $('#hostName').val(),
		"authType"     : $('#authType').val(),
		"clientID"     : $('#clientID').val(),
		"clientSecret" : $('#clientSecret').val(),
		"callbackURL"  : $('#callbackURL').val()
	};

	if( formData.hostName    === "" || formData.authType     === "" ||
	    formData.clientID    === "" || formData.clientSecret === "" ||	
	    formData.callbackURL === "" ) {

		   alert("It is necessary to input all values");
		   return false;

	}

	$.ajax({
		   url: "/auth/config/add",
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
			   alert('Entry added to database successfully');
		   },

		   error: function() {
			   alert('Error in adding data');
		   },
	});
})
