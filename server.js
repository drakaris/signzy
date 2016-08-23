/***************************
* Green Tribunal Scraper   *
* AUTHOR : Arjhun Srinivas *
* arjhun.s@gmail.com       *
***************************/

/*******************
* Config Variables *
*******************/
var config = {};
config.root = 'http://www.greentribunal.gov.in/';
config.url = config.root + 'search_all_case.aspx';
config.iterationEnd = 0;
config.pageCount = 2;
config.maxYearCount = 9;
config.yearCount = 1;

/*********************
* Required Utilities *
*********************/
var casper = require('casper').create({
  pageSettings : {
    loadImages : false
  }
});

var fs = require('fs');

/*************************
* User Defined Functions *
*************************/
function pageIterator() {
  // Page Iterator
  if(config.iterationEnd) {
    console.log('Iteration has ended');
    console.log('Iteration Flag unset');
    config.iterationEnd = 0;
    return;
  }

  casper.then(function() {
    // Process data
    this.then(function() {
      this.echo('Calling page scraper');
      pageScraper(2);
    });
    // Navigate to next page
    this.echo('Trying to navigate in-browser');
    this.thenEvaluate(function(page) {
      // Call javascript function to navigate
      __doPostBack('ctl00$content2$grv_all',page);
      console.log('Navigated to page : ' + page);
    }, 'Page$' + config.pageCount.toString());
    // Check if navigation is out of bound
    this.then(function() {
      if(this.getTitle() == "Oops. Error Occurred !!") {
        this.echo('Iteration Flag set');
        config.iterationEnd = 1;
        // Go back before navigation
        this.echo('Going back in time');
        this.back();
        // Navigate to first page
        this.echo('Navigating to first page');
        this.thenEvaluate(function(page) {
          __doPostBack('ctl00$content2$grv_all',page);
          console.log('Navigated');
        }, 'Page$First');
      }
    });
    // Iterate to next page
    this.then(function() {
      this.echo('Iterating to next page');
      config.pageCount += 1;
      pageIterator();
    });
  });
}

function pageScraper(i) {
  casper.then(function() {
    // Check for stop condition
    if(config.pageScraperStop) {
      this.echo('Stopping pageScraper');
      config.pageScraperStop = 0;
      return;
    }

    this.then(function() {
      // Check if row with index is present
      if(this.exists('#ctl00_content2_grv_all > tbody > tr:nth-child('+ i +')') && i <= 11) {
        // Extract data from row
        this.then(function() {
          var tmp = Object();
          tmp.category = this.fetchText('#ctl00_content2_grv_all > tbody > tr:nth-child('+ '2' +') > td:nth-child(2)');
          tmp.appeal_no = this.fetchText('#ctl00_content2_grv_all > tbody > tr:nth-child('+ i +') > td:nth-child(3)');
          tmp.original_app_no = this.fetchText('#ctl00_content2_grv_all > tbody > tr:nth-child('+ i +') > td:nth-child(4)');
          tmp.misc_app_no = this.fetchText('#ctl00_content2_grv_all > tbody > tr:nth-child('+ i +') > td:nth-child(5)');
          tmp.review_app_no = this.fetchText('#ctl00_content2_grv_all > tbody > tr:nth-child('+ i +') > td:nth-child(6)');
          tmp.parties = this.fetchText('#ctl00_content2_grv_all > tbody > tr:nth-child('+ i +') > td:nth-child(7)');
          tmp.date = this.fetchText('#ctl00_content2_grv_all > tbody > tr:nth-child('+ i +') > td:nth-child(8)');
          tmp.case_status = this.fetchText('#ctl00_content2_grv_all > tbody > tr:nth-child('+ i +') > td:nth-child(9)');
          tmp.files = config.root + this.getElementAttribute('#ctl00_content2_grv_all > tbody > tr:nth-child(' + i + ') > td:nth-child(10) > a', 'href');
          //this.echo(JSON.stringify(tmp,null,2));
          config.archive = tmp;
          delete(tmp);
        });
        // Go to all orders
        this.thenEvaluate(function(i) {
          if(i < 10) {
            __doPostBack('ctl00$content2$grv_all$ctl0' + i +'$lnkbtnshowall','');
          } else {
            __doPostBack('ctl00$content2$grv_all$ctl' + i +'$lnkbtnshowall','');
          }
        }, i);
        // Gather 'all orders' data
        this.then(function() {
          if(this.fetchText('#ctl00_content2_grv_allapp_order > tbody > tr > td') != "No Data Found") {
            // Orders found, gather.
            this.then(allOrdersScraper);
          } else {
            this.echo('All orders not available');
            //this.echo(JSON.stringify(config.archive,null,2));
          }
        });
        // Go back to search page
        this.then(function() {
          this.back();
        });
        // Log archive variable and delete
        this.then(function() {
          //this.echo(JSON.stringify(config.archive,null,2));
          this.emit('database.write', config.archive);
          delete(config.archive);
        });
      } else {
        this.echo('pageScraperStop flag set');
        config.pageScraperStop = 1;
      }
      // Increment index and call pageScraper
      this.then(function() {
        pageScraper(i + 1);
      });
    });
  });
}

function allOrdersScraper() {
  casper.then(function() {
    // Gather array of orders
    this.then(function() {
      var all_orders = Array();
      var i = 2;
      while(this.exists('#ctl00_content2_grv_allapp_order > tbody > tr:nth-child(' + (i+1) +')')) {
        var orders = Object();
        orders.category = this.fetchText('#ctl00_content2_grv_allapp_order > tbody > tr:nth-child('+ i +') > td:nth-child(2)');
        orders.parties = this.fetchText('#ctl00_content2_grv_allapp_order > tbody > tr:nth-child('+ i +') > td:nth-child(3)');
        orders.date = this.fetchText('#ctl00_content2_grv_allapp_order > tbody > tr:nth-child('+ i +') > td:nth-child(4)');
        orders.files = config.root + this.getElementAttribute('#ctl00_content2_grv_allapp_order > tbody > tr:nth-child('+ i +') > td:nth-child(5) > a','href');
        all_orders.push(orders);
        delete(orders);
        i += 1;
      }
      config.archive.all_orders = all_orders;
      delete (i);
      delete(all_orders);
    });
  });
}

function yearIterator() {
  casper.then(function() {
    if(config.yearCount > config.maxYearCount) {
      this.echo('Year Iterator limit hit');
      return;
    }
    // Select 'year' field.
    this.echo('> Selecting year : ' + config.yearCount);
    this.thenEvaluate(function(year) {
      console.log('Browser trying year select : ' + year);
      document.querySelector('#ctl00_content2_ddl_year').selectedIndex = year;
    }, config.yearCount);
    // Submit form
    this.thenClick('#ctl00_content2_btn_submit', function() {
      this.echo('> Form submitted');
    });
    // Start gathering data
    this.then(function() {
      if(this.fetchText('#ctl00_content2_grv_all > tbody > tr > td') != "No Data Found") {
        this.echo('Year Data found : ' + config.yearCount);
        pageIterator();
      } else {
        this.echo('No Year Data Found : ' + config.yearCount);
      }
    });
    this.then(function() {
      this.echo('Year count incremented');
      config.yearCount += 1;
      this.echo('Resetting pageCount');
      config.pageCount = 2;
      yearIterator();
    });
  });
}

/***********************
* Casper Events Module *
***********************/
casper.on('remote.message', function(msg) {
  this.echo(msg);
});

casper.on('database.write', function(archive) {
  //console.log(JSON.stringify(archive,null,2));
  fs.write('dump.txt',JSON.stringify(archive) + '\n','a');
});

casper.on("page.error", function(msg, trace) {
    //this.echo("Error: " + msg, "ERROR");
});

/*********************
* Casper Main Module *
*********************/
casper.start(config.url);
casper.echo('> Selecting type : All');
casper.thenEvaluate(function() {
  $('#ctl00_content2_ddl_case').val('1').change();
});

casper.then(yearIterator);

casper.run();
