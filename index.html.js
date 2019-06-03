module.exports = `
<!DOCTYPE html>
<html>
  <head>
    <title>A simple deployment with the Now API!</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link
      rel="stylesheet"
      href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css"
      integrity="sha384-BVYiiSIFeK1dGmJRAkycuHAHRg32OmUcww7on3RYdg4Va+PmSTsz/K68vbdEjh4u"
      crossorigin="anonymous"
    />
  </head>
  <body>
    <div class="container">
      <h2 class="heading" id="base_name"><span> </span></h2>
      <form class="form-horizontal" id="airtable_form"></form>

      <p id="success-msg" class="hidden">
        Thank you. Your response has been saved successfully.
      </p>

      <div class="row hidden">
        <div class="col-md-12">
          <table class="table table-striped" id="airtable_table">
            <thead id="airtable_table_thead"></thead>
            <tbody id="airtable_table_tbody"></tbody>
          </table>
        </div>
      </div>
    </div>

    <script src="https://code.jquery.com/jquery-1.12.2.min.js"></script>
    <script src="https://unpkg.com/airtable@0.6.0/build/airtable.browser.js"></script>

    <script>
      (function() {
        //Dynamic CONFIG
        const API_KEY = "[airtableAPIKey]";
        const BASE_KEY = "[airtableBaseKey]";
        const BASE_NAME = "[airtableBaseName]";
        const Form_Title = " [formTitle]";
        const COLUMNS = "[airtableFieldNames]";

        let formCreated = false;
        let columnSet = new Set();

        $("#base_name").append(Form_Title);

        let Airtable = require("airtable");
        let base = new Airtable({ apiKey: API_KEY }).base(BASE_KEY);

        //Create New Record
        let createNewRecord = function (data) {
          base(BASE_NAME).create(data,
            function(err, record) {
              if (err) {
                console.log(err);
                alert("Error in Saving the Record");
                return;
              }
              $(".input_txt").val('');
              $("#success-msg").removeClass("hidden");
              $("#airtable_form").addClass("hidden");
            }
          );
        };

        //Submit Click Event Listener
        function onSubmit(ev) {
          ev.preventDefault();
          const data = {};
          columnSet.forEach(function(column) {
            data[column] = $("#text_" + column).val();
          });
          createNewRecord(data);
        }

        $("#airtable_form").submit(onSubmit);

        //Paint Airtable Form
        let paintForm = function() {
          let form_html = "";
          $("#airtable_form").html("");
          columnSet.forEach(function(column) {
            form_html += '<div class="form-group"><label class="control-label col-sm-2" for="' + column + '">'+column+':</label><div class="col-sm-10"><input required type="text" class="form-control" id="text_'+column+'" placeholder="Enter '+column+'" name="'+column+'"></div></div>';
          });
          form_html += '<div class="form-group"><div class="col-sm-offset-2 col-sm-10"><button id="btn_form_submit" type="submit" class="btn btn-default">Submit</button></div></div>';
          $("#airtable_form").html(form_html);
        };

        const init = function() {
          columnSet = COLUMNS.split(",");
          paintForm();
        };
        init();
      })();
    </script>
  </body>
</html>
`