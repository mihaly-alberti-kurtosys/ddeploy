// TOOD handle change password
// TODO check which file changed since the last publish, publish only the newly changed files
// TODO error handling
// TODO :contains might not work properly with Text Component name "Test" and "Test 2" -- cause it's not exact mactch
// TODO get website by "Belongs to" tab content - and preview/publish by that

try {
	var SITE_USER = require('./cms_user');
}
catch(err) {
	if(typeof SITE_USER == 'undefined'){
		console.log('Error: credentials file not found!');
		console.log('Please create a "cms_user.js" in the root directory of this project with the following content: ');
		console.log('    exports.username = "yourusername";');
		console.log('    exports.password = "yourpassword"');
		console.log('\nDON\'T FORGET TO ADD THIS FILE TO IGNORE ON VERSION CONTROL!');
		phantom.exit(1);
	}

}

try {
	var SITE = require('./cms_config');
}
catch(err) {
	if(typeof SITE == 'undefined'){
		console.log('Error: config file not found!');
		console.log('Please create a "cms_config.js" in the root directory. Example file: ');
		console.log('\n');
		console.log('exports.config = {');
		console.log('	"url": "http://website.com/",');
		console.log('	"client": "someclient",');
		console.log('	"website": "somewebsite",');
		console.log('	"publish_type": 1, // 1: whole website, 2: only changed web pages');
		console.log('');
		console.log('	"components": [');
		console.log('		{');
		console.log('			"local": "a.txt",');
		console.log('			"remote": "upload test",');
		console.log('			"type": "Text component",');
		console.log('			"webpage": "Upload test" // optional for deployment (prev/publish)');
		console.log('		},');
		console.log('		{');
		console.log('			"local": "b.txt",');
		console.log('			"remote": "upload test 2",');
		console.log('			"type": "Text component",');
		console.log('			"webpage": "Upload test 2" // optional for deployment (prev/publish)');
		console.log('		},');
		console.log('		{');
		console.log('			"local": "c.txt",');
		console.log('			"remote": "upload test 3",');
		console.log('			"type": "Text component",');
		console.log('			"webpage": "Upload test 3" // optional for deployment (prev/publish)');
		console.log('		}');
		console.log('	]');
		console.log('}');

		phantom.exit(1);
	}

}

SITE.username = SITE_USER.username;
SITE.password = SITE_USER.password;

var current_component = 0;
var screenshot = 0;

var page = require('webpage').create();
page.viewportSize = {
  width: 1024,
  height: 768
};
var testindex = 0;
var loadInProgress = false;


page.onConsoleMessage = function(msg) {
  console.log(msg);
};

// page.onLoadStarted = function() {
// 	loadInProgress = true;
// 	console.log("load started");
// };

// page.onLoadFinished = function() {
// 	loadInProgress = false;
// 	console.log("load finished");
// };

function waitFor(testFx, onReady, timeOutMillis) {
	var maxtimeOutMillis = timeOutMillis ? timeOutMillis : 10000, //< Default Max Timout is 10s
		start = new Date().getTime(),
		condition = false,
		interval = setInterval(function() {
			if ( (new Date().getTime() - start < maxtimeOutMillis) && !condition ) {
				// If not time-out yet and condition not yet fulfilled
				condition = (typeof(testFx) === "string" ? eval(testFx) : testFx()); //< defensive code
			} else {
				if(!condition) {
					// If condition still not fulfilled (timeout but condition is 'false')
					console.log("'waitFor()' timeout");
					page.render('timeout.png');
					phantom.exit(1);
				} else {
					// Condition fulfilled (timeout and/or condition is 'true')
					// console.log("'waitFor()' finished in " + (new Date().getTime() - start) + "ms.");
					typeof(onReady) === "string" ? eval(onReady) : onReady(); //< Do what it's supposed to do once the condition is fulfilled
					clearInterval(interval); //< Stop this interval
				}
			}
		}, 250); //< repeat check every 250ms
};

// http://stackoverflow.com/questions/15739263/phantomjs-click-an-element
function click(el){
//	console.log('   > Found element:', el);
//	console.log('   > Click on element:', el.innerHTML);
    var ev = document.createEvent("MouseEvent");
    ev.initMouseEvent(
        "click",
        true /* bubble */, true /* cancelable */,
        window, null,
        0, 0, 0, 0, /* coordinates */
        false, false, false, false, /* modifier keys */
        0 /*left*/, null
    );
    el.dispatchEvent(ev);
}


page.open(SITE.config.url, function (status) {


	page.includeJs("http://ajax.googleapis.com/ajax/libs/jquery/1.6.1/jquery.min.js", function() {
		console.log('jQuery loaded...');
	});

	// Check for page load success
	if (status !== "success") {
		console.log("Unable to access network");
	} else {

		loadLoginForm = function() {
			console.log('Load login form');
			page.render('screenshot_'+screenshot+'.png'); screenshot++;
			waitFor(function() {
				// Check if the page is loaded
				return page.evaluate(function() {
					return $("#form1").is(":visible");
				});
			}, fillLoginForm);
		}

		fillLoginForm = function() {
			console.log('Fill login form');
			page.render('screenshot_'+screenshot+'.png'); screenshot++;
			// fill login form
			page.evaluate(function(SITE) {
				$("#Authentication1_TextboxUsername").val(SITE.username);
				$("#Authentication1_TextboxPassword").val(SITE.password);
				$("#Authentication1_TextboxClientName").val(SITE.config.client);
				$("#Authentication1_ButtonSignIn").click();
			}, SITE);

			waitFor(function() {
				// Check if the page is loaded
				return page.evaluate(function() {
					return $("#west-panel").length > 0 && $("#app-loading-mask").length == 0;
				});
			}, clickSystemTypes);

		}


		clickSystemTypes = function() {
			console.log('Select System Types');
			page.render('screenshot_'+screenshot+'.png'); screenshot++;

			page.evaluate(function(click) {
				// click on folder dropdown to open folder
				click($('span:contains(System Types)').eq(0)[0]);
			}, click);

			waitFor(function() {
				// Check if list is populated
				return page.evaluate(function() {
					return $("#app-loading-mask").length == 0;
				});
			}, textComponent);
		}

		textComponent = function() {
			console.log('Select text component');
			page.render('screenshot_'+screenshot+'.png'); screenshot++;

			page.evaluate(function(SITE) {
				$("td.x-toolbar-cell.k-toolbar-text-fill input").val(SITE.config.components[current_component].type);
			}, SITE);

			waitFor(function() {
				// Check if list is populated
				return page.evaluate(function() {
					return $("#app-loading-mask").length == 0;
				});
			}, FilltextComponent);
		}


		FilltextComponent = function() {
			page.evaluate(function(click, SITE) {
				click($("div.k-tab.k-tab-textcomponent span:contains("+SITE.config.components[current_component].type+")").val(SITE.config.components[current_component].type)[0]);
			}, click, SITE);

			waitFor(function() {
				// Check if list is populated
				return page.evaluate(function() {
					return $("#app-loading-mask").length == 0 && $('div[id^=entitytype-tab-] div.k-e-wrap').length > 0;
				});
			}, uploadtest);
		}

//////////////////////////////////////////


		uploadtest = function() {
			console.log('Uploading file ', SITE.config.components[current_component].local, '->', SITE.config.components[current_component].remote);
			page.render('screenshot_'+screenshot+'.png'); screenshot++;

			var pos = page.evaluate(function(SITE, current_component) {

				// get element position
				var pos = $('.x-panel-body.k-entity-tab.x-panel-body-noheader.x-panel-body-noborder span:contains('+SITE.config.components[current_component].remote+')').offset();
				// console.log(JSON.stringify(pos));
//								$('body').append('<div style="width: 3px; height: 3px; position: absolute; z-index: 100000; left:'+parseInt(pos.left+5)+'; top: '+parseInt(pos.top+5)+'; background-color: #f00"></div>');
				return pos
			}, SITE, current_component);

			// console.log('position for ', SITE.config.components[current_component].remote, JSON.stringify(pos))
			if(pos == null){
				console.log('Error getting coordinates for component, please re-run the script');
				phantom.exit(1);
			}
			page.sendEvent('click', pos.left+5, pos.top+5, 'left');
			page.sendEvent('doubleclick', pos.left+5, pos.top+5, 'left');

			waitFor(function() {
				// Check if list is populated
				return page.evaluate(function() {
					return $("#app-loading-mask").length == 0;
				});
			}, fillContent);
		}

		fillContent = function() {
			// console.log('Fill up component with local file content');
			page.render('screenshot_'+screenshot+'.png'); screenshot++;

			var fs = require('fs'),
			    system = require('system');

			var content = '',
			    f = null,
			    lines = null,
			    eol = system.os.name == 'windows' ? "\r\n" : "\n";

			try {
			    f = fs.open(SITE.config.components[current_component].local, "r");
			    content = f.read();
			} catch (e) {
			    console.log(e);
			}

			if (f) {
			    f.close();
			}

			page.evaluate(function(click, SITE, current_component, content) {

				$('div[id^=entity-tab].x-tab-panel:not(.x-hide-display)').find('span:contains(Content settings)').parents('fieldset').eq(0).find('textarea').val(content);
				click($('div[id^=entity-tab].x-tab-panel:not(.x-hide-display)').find('button.k-form-save')[0]);
			}, click, SITE, current_component, content);

			waitFor(function() {
				// Check if list is populated
				return page.evaluate(function() {
					return $("#app-loading-mask").length == 0;
				});
			}, done);
		}

		done = function() {
			if(current_component >= SITE.config.components.length-1){
				console.log("--- Done ---");
				page.render('screenshot_'+screenshot+'.png'); screenshot++;
				phantom.exit();
			} else {
				current_component++;
				FilltextComponent();  // go back to text components tab
			}

		}


		// start the process
		waitFor(function() {
			// Check in the page if a specific element is now visible
			return page.evaluate(function() {
				return typeof $ == 'function';
			});

		}, loadLoginForm);


	}
});


