ddeploy
=======

Automated deploying files to CMS


Optional attributes to pass
---------------------------

-  First argument: site config
-  Second argument: user credentials file

Example usage: `phantomjs ddeploy.js cms_config_uat.js cms_user_uat.js`


Example Site Config file
------------------------

NOTE: all property values are case-sensitive!

	exports.config = {
		"url": "http://website.com/",
		"client": "someclient",
		"website": "somewebsite",
		"publish_type": 1, // 1: whole website, 2: only changed web pages

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




Example User Credentials file
-----------------------------
	exports.username = "yourname";
	exports.password = "yourpassword"


TODO
====
-  "Article" content type
-  handle change password page
-  check which file changed since the last publish, publish only the newly changed files
-  error handling
-  :contains might not work properly with Text Component name "Test" and "Test 2" -- cause it's not exact mactch
-  get website by "Belongs to" tab content - and preview/publish by that
-  textComponent() in done() -> should be optimized


Contributing
============

Feel free to fork this project and make improvements. When you've finished, create a [pull request](https://help.github.com/articles/using-pull-requests) for the changes you've made.
