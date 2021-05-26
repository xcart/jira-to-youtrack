(function() {
    var JiraYoutrack = {
      version: "0.0.3",
      renderUi: renderUi,
      token: null
    }
    
    var stylesheet = `
    .css-button, .css-button:visited, .css-button:disabled, .css-button[disabled] {
        -webkit-box-align: baseline;
        align-items: baseline;
        border-width: 0px;
        border-radius: 3px;
        box-sizing: border-box;
        display: inline-flex;
        font-size: inherit;
        font-style: normal;
        font-family: inherit;
        font-weight: 500;
        max-width: 100%;
        position: relative;
        text-align: center;
        text-decoration: none;
        transition: background 0.1s ease-out 0s, box-shadow 0.15s cubic-bezier(0.47, 0.03, 0.49, 1.38) 0s;
        white-space: nowrap;
        background: rgba(9, 30, 66, 0.04);
        cursor: pointer;
        height: 2.28571em;
        line-height: 2.28571em;
        padding: 0px 10px;
        vertical-align: middle;
        width: auto;
        -webkit-box-pack: center;
        justify-content: center;
        outline: none;
        margin: 0px;
        color: rgb(66, 82, 110) !important;
    }
    
    .css-button:hover {
        text-decoration: inherit;
        transition: background 0s ease-out 0s, box-shadow 0.15s cubic-bezier(0.47, 0.03, 0.49, 1.38) 0s;
        background: rgba(9, 30, 66, 0.08);
    }
    
    .css-button:active, .css-button:focus {
        transition: background 0s ease-out 0s, box-shadow 0s cubic-bezier(0.47, 0.03, 0.49, 1.38) 0s;
        background: rgba(179, 212, 255, 0.6);
        color: rgb(0, 82, 204) !important;
    }
    `
    
    var event = new CustomEvent('jiraYoutrack.loaded', { detail: JiraYoutrack });
    document.dispatchEvent(event);
    
    function renderUi(options) {
        JiraYoutrack.token = options.token;
        JiraYoutrack.fetch = options.fetch;
        addStylesheet();
        findButtonPlacement().append(renderButton());
    }
    
    function renderButton() {
        var wrapper = document.createElement("div");
        wrapper.setAttribute("role", "presentation");
        var span = document.createElement("span");
        var btn = document.createElement("button");
        btn.type = "button";
        btn.classList.add('css-button');
        btn.onclick = onClick;
        var label = document.createElement("span");
        label.textContent = "Copy to YT";
        
        btn.append(label);
        span.append(btn);
        wrapper.append(span);
        
        return wrapper;
    }
    
    function addStylesheet() {
        var style = document.createElement("style");
        style.innerHTML = stylesheet;
        document.getElementsByTagName("head")[0].appendChild(style);   
    }

    async function onClick(event) {
        var info = await gatherInfoObject();
        var href = convertToUrl(info);
        window.open(href);
        //createClientValue(function (){
        //});
    }

    function findButtonPlacement() {
        return document.querySelector('div[data-test-id="issue.views.issue-details.issue-layout.left-most-column"] button[aria-label="Attach"]').closest('div[role="presentation"]').parentElement;
    }

    async function gatherInfoObject() {
        var info = {
            project: "WD",
            summary: getSummary(),
            description: await getDescription(),
        };

        var params = new URLSearchParams(info);

        var attrFields = gatherAttributeFields();
        console.log(attrFields);
        attrFields.forEach(item => params.append('c', item));

        var textFields = gatherTextFields();
        console.log(textFields);
        textFields.forEach(item => params.append('textFields', item));

        console.log(params);

        return params;
    }

    function gatherAttributeFields() {
        var startDate = getStartDate();
        var verificationDate = getVerificationDate();
        var dueDate = getDueDate();
        var estimation = getEstimation();
        var assignee = getAssignee();

        var fields = [
            'State ' + getState(),
            'Client ' + getClient()
        ];

        if (startDate) {
            fields.push('Start Date ' + startDate);
        }

        if (verificationDate) {
            fields.push('Verification date ' + verificationDate);
        }

        if (dueDate) {
            fields.push('Due Date ' + dueDate);
        }

        if (estimation) {
            fields.push('Estimation ' + estimation);
        }

        if (assignee) {
            fields.push('Assignee ' + assignee);
        }


        return fields;
    }

    function gatherTextFields() {
        var fields = [
            {id: '171-1', value: getExternalLinksText()},
            {id: '171-4', value: getRepoText()}
        ];

        return fields.map(item => new URLSearchParams(item).toString());
    }

    function getSummary() {
        var element = document.querySelector('h1[data-test-id="issue.views.issue-base.foundation.summary.heading"]');
        return element ? element.textContent : "Jira issue";
    }

    async function getDescription() {
        let content = retrieveSpecContent()
        let markdown = convertToMarkdown(content)
        return markdown
    }

    function retrieveSpecContent() {
        var container = document.querySelector('div[data-test-id="issue.views.field.rich-text.description"] div.ak-renderer-document');
        return container.innerHTML;
    }

    function convertToMarkdown(element) {
        if (typeof window.TurndownService !== "undefined") {
            var converter = window.TurndownService()
            return converter.turndown(element)
        }
        return element.innerText
    }
    

    function getExternalLinksText() {
        return "Jira Ticket: " + location.href + '\n';
    }

    function getRepoText() {
        return '';
    }

    function getAssignee() {
        return null;
    }

    function getState() {
        return 'Submitted';
    }
    
    function getStartDate() {
        return null;
    }

    function getDueDate() {
        return null;
    }

    function getVerificationDate() {
        return null;
    }

    function getEstimation() {
        var value = "4";
        return value ? value + 'h' : null;
    }

    function getClient() {
        return "Internal project";
    }

    function formatDate(str) {
        var date = new Date(str);
        return String(date.getFullYear()) + '-' + String(date.getMonth()+1).padStart(2,'0') + '-' + String(date.getDate()).padStart(2,'0');
    }

    function convertToUrl(params) {
        var baseUrl = "https://xcart.myjetbrains.com/youtrack/";
        const url = new URL('newIssue?' + params.toString(), baseUrl);
        return url.href;
    }

    function createClientValue(callback) {
        var data = JSON.stringify({
          "name": getClient(),
          "color": {
            "id": "0",
            "$type": "FieldStyle"
          },
          "description": "",
          "$type": "EnumBundleElement"
        });

        var xhr = new XMLHttpRequest();
        xhr.withCredentials = true;

        xhr.addEventListener("readystatechange", function () {
          if (this.readyState === 4) {
              console.log(this.responseText);
              callback();
          }
        });

        xhr.open("POST", "https://xcart.myjetbrains.com/youtrack/api/admin/customFieldSettings/bundles/enum/77-4/values?$top=-1&fields=$type,archived,assembleDate,avatarUrl,color%28id%29,description,fullName,hasRunningJob,id,isResolved,issueRelatedGroup%28icon%29,localizedName,login,name,ordinal,owner%28id,login,ringId%29,releaseDate,released,ringId,showLocalizedNameInAdmin,teamForProject%28ringId%29,usersCount");
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.setRequestHeader("Authorization", "Bearer " + JiraYoutrack.token);
        xhr.setRequestHeader("Accept", "*/*");
        xhr.setRequestHeader("Cache-Control", "no-cache");
        xhr.setRequestHeader("cache-control", "no-cache");

        xhr.send(data);
    }

})();
