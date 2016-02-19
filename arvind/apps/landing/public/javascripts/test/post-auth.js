/*
 * Query string:
 *     id=
 *     display_name=
 *     email=
 */
function query (variable) {
	var query = window.location.search.substring(1);
	var vars = query.split('&');
	for (var i = 0; i < vars.length; i++) {
		var pair = vars[i].split('=');
		if (decodeURIComponent(pair[0]) == variable) {
			return decodeURIComponent(pair[1]);
		}
	}
	return null;
}

var id = query('id');
var display_name = query('display_name');
var email = query('email');

/*
 * The identity is based (partially) off the specifications here:
 *     Portable Contacts 1.0 Draft C
 *         http://portablecontacts.net/draft-spec.html#schema
 */
var identity = {
		vc_id       : null,                   /* Assigned by the session controller */
		vc_auth_ts  : (new Date()).toISOString(),
		id          : id || '--random-default-id',
		displayName : display_name || 'buddha is smiling',
		nickname    : '--none-yet--',
		birthday    : '--none-yet--',
		anniversary : '--none-yet--',
		gender      : '--none-yet--',
		utcOffset   : '--none-yet--',
		emails      : [
			{
				value   : email || '--random@email.com--',
				type    : '--none-yet',    /* work, home or other */
				primary : true
			},
		],
		phoneNumbers: [
			{
				value   : '--none-yet',
				type    : '--none-yet',    /* work, home or other */
				primary : true
			},
		],
		photos      : [
			{
				value   : '--none-yet',
				type    : '--none-yet',    /* work, home or other */
				primary : true
			},
		],
		addresses   : [
			{
				formatted     : '--none-yet',
				streetAddress : '--none-yet',
				locality      : '--none-yet',
				region        : '--none-yet',
				postalCode    : '--none-yet',
				country       : '--none-yet',
			},
		],
};

/*
 * This should extract and store the identity of the 
 * current user. Likely this will happen by extracting
 * the encrypted information in the cookies, which will
 * be stored via the passport auth module. TODO.
 *
 * Hardcoding for now. */


var id_string = JSON.stringify(identity);
var id_uriencoded = encodeURIComponent(id_string);

document.cookie = "wiziq_auth=" + id_uriencoded + "; max-age=7200; path=/";
console.log ('cookies = ', document.cookie);

window.location = '/landing/session/v1/meghadoot';
