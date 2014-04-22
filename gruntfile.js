
'use strict';

// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/{,*/}*.js'
// use this if you want to recursively match all subfolders:
// 'test/spec/**/*.js'

module.exports = function (grunt) {

  // Load grunt tasks automatically
  require('load-grunt-tasks')(grunt);

  // Time how long tasks take. Can help when optimizing build times
  require('time-grunt')(grunt);

  // Define the configuration for all the tasks
  grunt.initConfig({

    // Project settings
    pkg: grunt.file.readJSON('package.json'),
    library: grunt.file.readJSON('bower.json'),
    ngSecure: {
      // configurable paths
      src: 'src',
      dist: 'dist'
    },

    concat: {
      options: {
        separator: ''
      },
      library: {
        src: [
          '<%= ngSecure.src %>/<%= library.name %>.prefix',
          '<%= ngSecure.src %>/**/*.js',
          '<%= ngSecure.src %>/<%= library.name %>.suffix'
        ],
        dest: '<%= ngSecure.dist %>/<%= library.name %>.js'
      }
    },

    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
      },
      jid: {
        files: {
          '<%= ngSecure.dist %>/<%= library.name %>.min.js': ['<%= concat.library.dest %>']
        }
      }
    },

    // Make sure code styles are up to par and there are no obvious mistakes
    jshint: {
      options: {
        jshintrc: '.jshintrc',
        reporter: require('jshint-stylish')
      },
      all: [
        'Gruntfile.js',
        '<%= ngSecure.src %>/{,*/}*.js'
      ],
      test: {
        options: {
          jshintrc: 'test/.jshintrc'
        },
        src: ['test/spec/{,*/}*.js']
      }
    },

    // ngmin tries to make the code safe for minification automatically by
    // using the Angular long form for dependency injection. It doesn't work on
    // things like resolve or inject so those have to be done manually.
    ngmin: {
      dist: {
        files: [{
          expand: true,
          cwd: '<%= ngSecure.dist %>',
          src: '*.js',
          dest: '<%= ngSecure.dist %>'
        }]
      }
    },

    // Test settings
    karma: {
      unit: {
        configFile: 'karma.conf.js',
        singleRun: true
      }
    }
  });

  grunt.registerTask('default', [
    //'jshint:all',
    'concat',
    'uglify'
  ]);
};
