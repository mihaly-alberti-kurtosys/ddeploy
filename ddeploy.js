var system = require('system');
var args = system.args;


if (args.length === 1) {
	try {
		var SITE_USER = require('./cms_user');
	}
	catch(err) {
		if(typeof SITE_USER == 'undefined'){
			console.error('ERROR: credentials file not found!');
			console.info('Please create a "cms_user.js" in the root directory of this project with the following content: ');
			console.info('    exports.username = "yourusername";');
			console.info('    exports.password = "yourpassword"');
			console.info('\nDON\'T FORGET TO ADD THIS FILE TO IGNORE IN VERSION CONTROL!');
			phantom.exit(1);
		}

	}

	try {
		var SITE = require('./cms_config');
	}
	catch(err) {
		if(typeof SITE == 'undefined'){
			console.error('ERROR: config file not found!');
			console.info('Please create a "cms_config.js" in the root directory. Example file: ');
			console.info('\n');
			console.info('exports.config = {');
			console.info('	"url": "http://website.com/",');
			console.info('	"client": "someclient",');
			console.info('	"website": "somewebsite",');
			console.info('	"publish_type": 1, // 0: manual publish, 1: whole website, 2: only changed web pages');
			console.info('');
			console.info('	"components": [');
			console.info('		{');
			console.info('			"local": "a.txt",');
			console.info('			"remote": "upload test",');
			console.info('			"type": "Text component",');
			console.info('			"webpage": "Upload test" // optional for deployment (prev/publish)');
			console.info('		},');
			console.info('		{');
			console.info('			"local": "b.txt",');
			console.info('			"remote": "upload test 2",');
			console.info('			"type": "Text component",');
			console.info('			"webpage": "Upload test 2" // optional for deployment (prev/publish)');
			console.info('		},');
			console.info('		{');
			console.info('			"local": "c.txt",');
			console.info('			"remote": "upload test 3",');
			console.info('			"type": "Text component",');
			console.info('			"webpage": "Upload test 3" // optional for deployment (prev/publish)');
			console.info('		}');
			console.info('	]');
			console.info('}');

			phantom.exit(1);
		}

	}
}
else {
	var SITE = require('./'+args[1]);
	var SITE_USER = require('./'+args[2]);
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
	var maxtimeOutMillis = timeOutMillis ? timeOutMillis : 15000, //< Default Max Timout is 10s
		start = new Date().getTime(),
		condition = false,
		interval = setInterval(function() {
			if ( (new Date().getTime() - start < maxtimeOutMillis) && !condition ) {
				// If not time-out yet and condition not yet fulfilled
				condition = (typeof(testFx) === "string" ? eval(testFx) : testFx()); //< defensive code
				console.log('...');
			} else {
				if(!condition) {
					// If condition still not fulfilled (timeout but condition is 'false')
					console.log("Operation took too long, timeout");
					page.render('screenshot_timeout.png');
					phantom.exit(1);
				} else {
					// Condition fulfilled (timeout and/or condition is 'true')
					// console.log("'waitFor()' finished in " + (new Date().getTime() - start) + "ms.");
					typeof(onReady) === "string" ? eval(onReady) : onReady(); //< Do what it's supposed to do once the condition is fulfilled
					clearInterval(interval); //< Stop this interval
				}
			}
		}, 500);
};

// http://stackoverflow.com/questions/15739263/phantomjs-click-an-element
function click(el){
	// console.log('   > Found element:', el);
	// console.log('   > Click on element:', el.innerHTML);
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
		console.error("ERROR: Unable to access network");
	} else {

		loadLoginForm = function() {
			console.log('-- Load login form');
			// page.render('screenshot_'+screenshot+'.png'); screenshot++;
			waitFor(function() {
				// Check if the page is loaded
				return page.evaluate(function() {
					return $("#form1").is(":visible");
				});
			}, fillLoginForm);
		}

		fillLoginForm = function() {
			console.log('-- Fill login form');
			// page.render('screenshot_'+screenshot+'.png'); screenshot++;
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
			console.log('-- Select System Types');
			// page.render('screenshot_'+screenshot+'.png'); screenshot++;

			page.evaluate(function(click) {
				// click on folder dropdown to open folder
				click($('span:contains(System Types)').eq(0)[0]);
			}, click);

			waitFor(function() {
				// Check if list is populated
				return page.evaluate(function() {
					return $("#app-loading-mask").length == 0 && $('.x-panel-bwrap div[id^=ext-comp]:visible .k-et-wrap').length > 0;
				});
			}, clickTextComponent);
		}


		clickTextComponent = function() {
			console.log('-- Component: ', SITE.config.components[current_component].type);
			page.evaluate(function(click, SITE, current_component) {
				var compo = SITE.config.components[current_component].type.toLowerCase().replace(/\s/g, "");
				click($('div.k-tab.k-tab-'+compo+' span:contains('+SITE.config.components[current_component].type+')')[0]);
			}, click, SITE, current_component);

			waitFor(function() {
				// Check if list is populated
				return page.evaluate(function() {
					return ($('div[id^=entitytype-tab-] div.k-e-wrap').length > 0 && $("#app-loading-mask").length == 0);
				});
			}, uploadtest);

			// page.render('screenshot_'+screenshot+'.png'); screenshot++;
		}

//////////////////////////////////////////


		uploadtest = function() {
			console.info('Uploading file ', SITE.config.components[current_component].local, '->', SITE.config.components[current_component].remote);
			// page.render('screenshot_'+screenshot+'.png'); screenshot++;

			var pos = page.evaluate(function(SITE, current_component) {

				// get element position
				var pos = $('.x-panel-body.k-entity-tab.x-panel-body-noheader.x-panel-body-noborder span:contains('+SITE.config.components[current_component].remote+')').offset();
				// console.log(JSON.stringify(pos));
//								$('body').append('<div style="width: 3px; height: 3px; position: absolute; z-index: 100000; left:'+parseInt(pos.left+5)+'; top: '+parseInt(pos.top+5)+'; background-color: #f00"></div>');
				return pos
			}, SITE, current_component);

			// console.log('position for ', SITE.config.components[current_component].remote, JSON.stringify(pos))
			if(pos == null){
				console.error('ERROR getting coordinates for component, please re-run the script');
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
			// console.info('-- Fill up component with local file content');
			// page.render('screenshot_'+screenshot+'.png'); screenshot++;

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
			    console.error(e);
			}

			if (f) {
			    f.close();
			}

			if(content == null || content == '') {
				console.error('ERROR: Unable to get contents of file, check if local path is correct');
				phantom.exit(1);
			}

			page.evaluate(function(click, SITE, current_component, content) {
				if(SITE.config.components[current_component].type == 'Text component'){
					$('div[id^=entity-tab].x-tab-panel:not(.x-hide-display)').find('span:contains(Content settings)').parents('fieldset').eq(0).find('textarea').val(content);
				} else if(SITE.config.components[current_component].type == 'Web Include') {
					$('div[id^=entity-tab].x-tab-panel:not(.x-hide-display)').find('textarea').val(content);
				}
				console.info('Saving file...');
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

				switch(SITE.config.publish_type) {
					case 0:
						console.info('\n\n--- Done \\o/ ---');
						console.info('--- You can now deploy the Site manually. ---');
						phantom.exit();
						break;
					case 1:
						deploy();
						// console.info('\n\nSorry, not implemented yet :(');
						// phantom.exit();
						break;

					case 2:
						console.info('\n\nSorry, not implemented yet :(');
						phantom.exit();
						break;
				}

				// page.render('screenshot_'+screenshot+'.png'); screenshot++;

			} else {
				current_component++;
				clickTextComponent();  // go back to text components tab
			}

		}

		deploy = function() {
			console.log('Deploying website: ' + SITE.config.website);

			page.evaluate(function(click, SITE) {
				click($('div.k-tab.k-tab-website span:contains(Website)')[0]);
			}, click, SITE);

			waitFor(function() {
				// Check if list is populated
				return page.evaluate(function() {
					return ($('div[id^=entitytype-tab-] div.k-e-wrap').length > 0 && $("#app-loading-mask").length == 0);
				});
			}, showDropMenu);


		};

		showDropMenu = function(nextEvent) {
			// console.log('showDropMenu');

			if(!nextEvent) {
				nextEvent = checkOutAll;
			}
			page.evaluate(function(click, SITE) {
				click($('.x-panel-body.k-entity-tab.x-panel-body-noheader.x-panel-body-noborder span:contains('+SITE.config.website+')').next('.k-entity-inline')[0]);
			}, click, SITE);

			waitFor(function() {
				// page.render('screenshot_'+Math.random()+'.png');
				// Check if list is populated
				return page.evaluate(function() {
					return $('.x-menu.x-menu-floating:visible').length > 0 && !$("body").hasClass('x-masked');
				});
			}, nextEvent);

		};

		checkOutAll = function() {
			console.log('Checkout All');
			page.evaluate(function(click, SITE) {
				click($('.x-menu-item-text:contains(Checkout All)')[0]);
			}, click, SITE);


			waitFor(function() {
				// page.render('screenshot_'+Math.random()+'.png');
				// Check if list is populated
				return page.evaluate(function() {
					return !$("body").hasClass('x-masked');
				});
			}, function() {
				showDropMenu(submitAll);
			});


		};

		submitAll = function() {
			console.log('Submit All');
			page.evaluate(function(click, SITE) {
				click($('.x-menu-item-text:contains(Submit All)')[0]);
			}, click, SITE);

			waitFor(function() {
				// page.render('screenshot_'+Math.random()+'.png');
				return page.evaluate(function() {
					return !$("body").hasClass('x-masked');
				});
			}, function() {
				showDropMenu(approveAll);
			});
		};

		approveAll = function() {
			console.log('Approve All');
			page.evaluate(function(click, SITE) {
				click($('.x-menu-item-text:contains(Approve All)')[0]);
			}, click, SITE);

			waitFor(function() {
				// page.render('screenshot_'+Math.random()+'.png');
				return page.evaluate(function() {
					return !$("body").hasClass('x-masked');
				});
			}, function() {
				showDropMenu(publish);
			});
		};

		publish = function() {
			console.log('Publish! \\o/');
			page.evaluate(function(click, SITE) {
				click($('.x-menu-item-text:contains(Publish)')[0]);
			}, click, SITE);

			waitFor(function() {
				return page.evaluate(function() {
					return !$("body").hasClass('x-masked');
				});
			}, function() {
				console.log('-- \\o/ Published \\o/ --')
				phantom.exit(0);
			});


		};




/* --------------------------------------------------------------------------------------------- */


		// start the process
		waitFor(function() {
			// Check in the page if a specific element is now visible
			return page.evaluate(function() {
				return typeof $ == 'function';
			});

		}, loadLoginForm);


	}
});


