module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
      '  */\n',
    clean: {
      src: ['public/dist']
    },
    less: {
      compile: {
        options: {
          yuicompress: true
        },
        files: {
          'public/dist/css/flat-site.css': 'public/less/flat-site.less',
          'public/dist/css/flat-editor.css': 'public/less/flat-editor.less'
        }
      }
    },
    concat: {
      js_deps: {
        src: [
          'public/js/deps/jquery-1.8.2.min.js',
          'public/js/deps/angular.min.js',
          'public/js/deps/angular-resource.min.js'
        ],
        dest: 'public/dist/js/common.min.js'
      },
      js_auth: {
        src: [
          'public/js/auth/app.js', 
          'public/js/auth/controllers.js',
          'public/js/auth/services.js'
        ],
        dest: 'public/dist/js/flat-auth.js'
      }
    },
    uglify: {
      options: {
        stripBanners: true,
        banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
        '<%= grunt.template.today() %> */\n',
        mangle: false
      },
      dist: {
        files: {
          'public/dist/js/flat-auth.min.js': '<%= concat.js_auth.dest %>'
        }
      },
    }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.registerTask('default', ['clean', 'less', 'concat', 'uglify']);
};