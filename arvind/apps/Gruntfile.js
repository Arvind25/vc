module.exports = function(grunt) {

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		"requirejs" : { /* Later */ },
		"ecosystem" : {
			'dev': {},
			'production' : {}
		},
	});

	/*
	grunt.loadNpmTasks('grunt-contrib-requirejs');
	grunt.loadNpmTasks('grunt-if-modified');
     */

	grunt.registerMultiTask('ecosystem', 'Generate Ecosystem file', ecosystem);

	grunt.registerTask('default', ['requirejs']);

	function ecosystem (args) {

		console.log ('args = ', args);
		var env = this.target;
	}

};
