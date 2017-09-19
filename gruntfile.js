module.exports = function (grunt) {
    grunt.initConfig({
        browserify: {
            dist: {
                options: {
                    transform: [
                        ["babelify", {
                            
                            plugins: [
                                "transform-es2015-classes",
                                ["transform-builtin-classes", {
                                    "globals": ["Array", "Error", "HTMLElement"]
                                }]
                            ],
                            presets: ["es2015"]
                        }]
                    ]
                },
                files: {
                    "./index.js": ["./src/index.js"]
                }
            }
        },
        watch: {
            scripts: {
                files: ["./src/**/*.js"],
                tasks: ["browserify"]
            }
        }
    });

    grunt.loadNpmTasks("grunt-browserify");
    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-run");

    grunt.registerTask("default", ["watch"]);
    grunt.registerTask("build", ["browserify"]);
};