/* eslint-disable */
// a copy of the script beiign run at the answers spreadsheet

function Initialize() {
  try {
    var triggers = ScriptApp.getProjectTriggers();
    for (var i in triggers)
      ScriptApp.deleteTrigger(triggers[i]);
    ScriptApp.newTrigger("SubmitGoogleFormData")
      .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
      .onFormSubmit().create();
  } catch (error) {
    throw new Error("Please add this code in the Google Spreadsheet");
  }
}

function SubmitGoogleFormData(e) {
  if (!e) { throw new Error("Please go the Run menu and choose Initialize"); }
  try {

    var ss = SpreadsheetApp.getActiveSheet();    // get the active sheet
    var lr = ss.getLastRow();                    // get the last row

    var respostas = [];
    var colunasLength = ss.getMaxColumns();

    for (var i = 1; i < colunasLength; i++) { // columns start at 1, we skip timestamp
      var pergunta = ss.getRange(1, i, 1, 1).getValue();
      if (pergunta && pergunta.length > 0) {
        var resposta = ss.getRange(lr, i, 1, 1).getValue();

        respostas.push({
          "pergunta": pergunta,
          "resposta": resposta.replace(/#+/g, '').replace(/  /g, ' ') // remove # from response, remove double space from answer
        });
      }
    }

    var payload = {
      "nome_sheet": ss.getName(),
      "respostas": respostas
    };

    var payload = {
      "nome_sheet": ss.getName(),
      "timestamp": timestamp,
      "respostas": respostas
    };

    // whatever
    var headers = {
      "Authorization": "Basic " + Utilities.base64Encode('99uEzPjdf3U6crJHr35p:X')
    };

    var options = {
      'method': 'post',
      "contentType": "application/json",
      'headers': headers,
      'payload': JSON.stringify(payload),
      'muteHttpExceptions': false
    }

    var url = "https://xxx.ngrok.io/spread";
    // make the call
    var response = UrlFetchApp.fetch(url, options);
    // log the response (useful for debugging )
    Logger.log(JSON.stringify(response));


  } catch (error) { Logger.log(error.toString()); }
}