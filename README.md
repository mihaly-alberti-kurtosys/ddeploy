ddeploy
=======

Automated deploying files to Kurtosys CMS


Optional attributes to pass
---------------------------

-  First argument: site config
-  Second argument: user credentials file

Example usage: `phantomjs ddeploy.js cms_config_uat.js cms_user_uat.js`


Example Site Config file
------------------------

NOTE: all property values are case-sensitive!

```javascript
exports.config = {
	"url": "http://website.com/",
	"client": "someclient",
	"website": "somewebsite",
	"publish_type": 1, // 0: manual publish, 1: whole website, 2: only changed web pages

	"components": [
		{
			"local": "a.txt",
			"remote": "a file",
			"type": "Text component",
			"webpage": "somewebpage" // optional for deployment (prev/publish)
		},
		{
			"local": "b.txt",
			"remote": "b file",
			"type": "Text component",
			"webpage": "somewebpage" // optional for deployment (prev/publish)
		},
		{
			"local": "c.txt",
			"remote": "c file",
			"type": "Text component",
			"webpage": "somewebpage" // optional for deployment (prev/publish)
		}
	]
}
```



Example User Credentials file
-----------------------------
	exports.username = "yourname";
	exports.password = "yourpassword"


__Don't forget to add this file to ignore in version control!__

Usage with Grunt
----------------
-  Install `grunt-exec`
-  Include `grunt.loadNpmTasks('grunt-exec');` in `Gruntfile.js`
-  Create a Grunt task in `Gruntfile.js` (inside `grunt.initConfig({ ... })` block)

```javascript
exec: {
	deploy_to_fundnet_uat: {
		command: 'phantomjs ddeploy.js cms_config_uat.js cms_user_uat.js'
	},
	deploy_to_fundnet_prod: {
		command: 'phantomjs ddeploy.js cms_config_prod.js cms_user_prod.js'
	}
}
```

-  Then register the tasks

```javascript
grunt.registerTask('ddeploy-uat', [
	'exec:deploy_to_fundnet_uat'
]);

grunt.registerTask('ddeploy-prod', [
	'exec:deploy_to_fundnet_prod'
]);
```

-  You can now run `grunt ddeploy-uat` or `grunt ddeploy-prod` to deploy files to CMS


Possible Errors
===============

If you try to publish to an `https` site and there is a problem in the background with the certificates, you can ignore them with `--ignore-ssl-errors=yes` like:
```javascript
exec: {
  deploy_to_fundnet_uat: {
    command: 'phantomjs --ignore-ssl-errors=yes ddeploy.js cms_config_uat.js cms_user_uat.js'
  },
  deploy_to_fundnet_prod: {
    command: 'phantomjs --ignore-ssl-errors=yes ddeploy.js cms_config_prod.js cms_user_prod.js'
  }
}
```


Contributing
============

In lieu of a formal styleguide, take care to maintain the existing coding style.

Feel free to fork this project and make improvements. When you've finished, create a [pull request](https://help.github.com/articles/using-pull-requests) for the changes you've made.


TODO
====

- [ ] "publish_type": 2 // only changed web pages
- [ ] When a file is on the 2nd page of the e.g.: Web Include page, it fails to filter, the uploading fails
- [ ] Wait for page to be published before exiting
