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
    var completeQuery = stringArray[0]+ " declare default element namespace 'http://www.tei-c.org/ns/1.0'; base-uri(" + query + ")";
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
      console.log("Result: "+result.result);
      res.render('search', { title: title, content: result.result });
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
