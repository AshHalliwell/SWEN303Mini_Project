var express = require('express');
var router = express.Router();
var basex = require('basex');
var client = new basex.Session("127.0.0.1", 1984, "admin", "admin");
var title = "Colenso Database";
client.execute("OPEN Colenso");


router.get('/search', function(req, res) {
  var searchTerm = req.query.searchString;
  var stringArray = searchTerm.split(" ");
  var completeQuery;
  if(stringArray[0] === "XQUERY"){
    var query = " ";
    for(i=1;i<stringArray.length;i++){
      query += stringArray[i]+ " ";
    }
    var completeQuery = stringArray[0]+ " declare default element namespace 'http://www.tei-c.org/ns/1.0'; for $n in " + query + "\n return (doc(base-uri($n))//titleStmt, base-uri($n))";
  }
  //client.execute("XQUERY declare default element namespace 'http://www.tei-c.org/ns/1.0'; " +
//"//name[@type = 'place' and position() = 1 and . = '"+searchTerm+"']",
  client.execute(completeQuery,
  function (error, result) {
    if(error){
      console.error(error);
      var errorMessage = "Invalid XQUERY: "+ error;
      res.render('search', { title: title, content:errorMessage })
    }
    else {
      var content = "";
      if(result.result){
        var resultArray = result.result.split(".xml");
        content = "Documents that matched your query: </br> <div id='resultsTable'><form action='document'>";
          for(i = 0 ; i < resultArray.length - 1; i++ ){
            var currentResult = resultArray[i].split("</titleStmt>");
            var titleStmtArray = currentResult[0].split("<author>");
            content += "<div class= 'result'><button name='documentURI' value='" + currentResult[1] + "'>" + titleStmtArray[0] + "Written by <author>" +titleStmtArray[1] + "</button></div>";
          }
        content+= "</form></div>";
      }
      //split on author tag?
      //throw extra formating tags in and table
      res.render('search', { title: title, content: content });
    }
  }
  );
});

/* GET home page. */
router.get("/",function(req,res){
client.execute("XQUERY declare default element namespace 'http://www.tei-c.org/ns/1.0';" +
" (//name[@type='place'])[1] ",
function (error, result) {
  if(error){ console.error(error);}
  else {
    res.render('index', { title: title, place: result.result });
  }
    }
    );
});


module.exports = router;
