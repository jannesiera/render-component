module.exports = function (grunt) {
    grunt.initConfig({
        babel: {
		options: {
            // TODO These plugins might not be necessary
			plugins: [
                "transform-es2015-classes",
                ["transform-builtin-classes", {
                    "globals": ["Array", "Error", "HTMLElement"]
                }]
            ],
            
			presets: ["es2015"]
		},
		dist: {
			files: {
				"./index.js": ["./src/index.js"]
			}
		}
	},
        watch: {
            scripts: {
                files: ["./src/**/*.js"],
                tasks: ["babel"]
            }
        }
    });

    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-run");
    grunt.loadNpmTasks("grunt-babel");

    grunt.registerTask("default", ["watch"]);
    grunt.registerTask("build", ["babel"]);
};