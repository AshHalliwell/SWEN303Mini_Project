var express = require('express');
var router = express.Router();
var basex = require('basex');
var client = new basex.Session("127.0.0.1", 1984, "admin", "admin");
var title = "Colenso Project";
client.execute("OPEN Colenso");

var parseSearch = function(array, currentString, index){
  //if last word
  if(index == array.length - 1){
    //Check for Wildcard
    var wildcardIndex = array[index].indexOf('*');
    if(wildcardIndex >= 0){
      var before = "";
      var after = "";
      if(wildcardIndex !=0){
        before = array[index].substring(0,wildcardIndex);
      }
      if(wildcardIndex!=array[index].length -1){
        after = array[index].substring(wildcardIndex+1);
      }
      var newString = currentString + before + "\\S+" + after;
      return "(matches(string($n), '" + newString + "'))";
    }
    return "(matches(string($n), '" + currentString + array[index] + "'))";
  }
    //AND operator
    else if(array[index].toUpperCase() === "AND"){
      return "(matches(string($n), '" + currentString + "')) and "+ parseSearch(array, "",index + 1);
    }
    //OR operator
    else if(array[index].toUpperCase() === "OR"){
      return "(matches(string($n), '" + currentString + "')) or "+ parseSearch(array, "",index + 1);
    }
    //NOT operator
    else if(array[index].toUpperCase() === "NOT"){
      if(currentString != ""){
        return "(matches(string($n), '" + currentString + "')) not("+ parseNot(array, "",index + 1);
      }
      return "not("+ parseNot(array, "",index + 1);
    }
    //Wildcard
    var wildcardIndex = array[index].indexOf('*');
    if(wildcardIndex >= 0){
      var before = "";
      var after = "";
      if(wildcardIndex !=0){
        before = array[index].substring(0,wildcardIndex);
      }
      if(wildcardIndex!=array[index].length -1){
        after = array[index].substring(wildcardIndex+1);
      }
      var newString = currentString + before + "\\S+?" + after;
      return parseSearch(array, newString, index +1);
    }
    //normal search terms
    else{
      var newString = currentString + array[index]+ " ";
      return parseSearch(array, newString, index +1);
    }
  }

var parseNot = function(array, currentString, index){
  if(index == array.length - 1){
    //Check for Wildcard
    var wildcardIndex = array[index].indexOf('*');
    if(wildcardIndex >= 0){
      var before = "";
      var after = "";
      if(wildcardIndex !=0){
        before = array[index].substring(0,wildcardIndex);
      }
      if(wildcardIndex!=array[index].length -1){
        after = array[index].substring(wildcardIndex+1);

      }
      var newString = currentString + before + "\\S+?" + after;
      return "(matches(string($n), '" + newString + "')))";
    }
    return "(matches(string($n), '" + currentString + array[index] + "')))";
  }
    //AND operator
    else if(array[index].toUpperCase() === "AND"){
      return "(matches(string($n), '" + currentString + "'))) and "+ parseSearch(array, "",index + 1);
    }
    //OR operator
    else if(array[index].toUpperCase() === "OR"){
      return "(matches(string($n), '" + currentString + "'))) or "+ parseSearch(array, "",index + 1);
    }
    else if(array[index].toUpperCase() === "NOT"){
      if(currentString != ""){
        return "(matches(string($n), '" + currentString + "')) not("+ parseNot(array, "",index + 1);
      }
      return "not("+ parseNot(array, "",index + 1);
    }
    //Wildcard
    var wildcardIndex = array[index].indexOf('*');
    if(wildcardIndex >= 0){
      var before = "";
      var after = "";
      if(wildcardIndex !=0){
        before = array[index].substring(0,wildcardIndex);
      }
      if(wildcardIndex!=array[index].length -1){
        after = array[index].substring(wildcardIndex+1);
      }
      var newString = currentString + before + "\\S+?" + after;
      return parseNot(array, newString, index +1);
    }
    //normal search terms
    else{
      var newString = currentString + array[index]+ " ";
      return parseNot(array, newString, index +1);
    }
}


router.get('/document', function(req, res) {
  //console.log(req.query.document);
  client.execute("XQUERY doc('" + req.query.documentURI + "')",
  function(error, result){
    var content;
    if(error){
      console.log(error);
      content = "There was an error loading this document";
      res.render('document', { title: title, content:content });
    }
    else{
      content = "<div class='letter'>";
      //var contentArray = result.result.split(" ");
      content += result.result;
      content += "</div>";
      res.render('document', { title: title, content:content});
    }
  }
  );

});


router.get('/search', function(req, res) {
  var searchTerm = req.query.searchString;
  var stringArray = searchTerm.split(" ");
  var completeQuery;
  if(stringArray[0] === "XQUERY"){
    var query = " ";
    for(i=1;i<stringArray.length;i++){
      query += stringArray[i]+ " ";
    }
    completeQuery = stringArray[0]+ " declare default element namespace 'http://www.tei-c.org/ns/1.0'; for $n in " + query + "\n return (doc(base-uri($n))//titleStmt, base-uri($n))";
  }
  else{
    var query = parseSearch(stringArray, "", 0);
    console.log(query);
    completeQuery = "XQUERY declare default element namespace 'http://www.tei-c.org/ns/1.0'; for $n in //teiHeader where " + query + " return (doc(base-uri($n))//titleStmt, base-uri($n))";
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
        var URIlist = "";
        content = "Documents that matched your query: </br> <div id='resultsTable'><form action='document'>";
          for(i = 0 ; i < resultArray.length - 1; i++ ){
            var currentResult = resultArray[i].split("</titleStmt>");
            if(URIlist.indexOf(currentResult[1]) == -1){
              URIlist +=currentResult[1];
              var titleStmtArray = currentResult[0].split("<author>");
              content += "<div class= 'result'><button name='documentURI' value='" + currentResult[1] + ".xml'>" + titleStmtArray[0] + "Written by <author>" +titleStmtArray[1] + "</button></div>";
            }
          }
        content+= "</form></div>";
      }
      else{
        content = "No documents matched your query: "+ req.query.searchString;
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
