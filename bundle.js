(function() {
    var JiraYoutrack = {
      version: "0.0.1",
      renderUi: renderUi,
      token: null
    }
    
    var event = new CustomEvent('jiraYoutrack.loaded', { detail: JiraYoutrack });
    document.dispatchEvent(event);
    
    function renderUi(options) {
        JiraYoutrack.token = options.token;
        JiraYoutrack.fetch = options.fetch;
        var wrapper = document.createElement("td");
        wrapper.style.paddingLeft = '30px';
        var btn = document.createElement("input");
        btn.value = "Create YouTrack Ticket";
        btn.type = 'button';
        btn.classList.add('submit');
        btn.onclick = onClick;
        wrapper.append(btn);
        findButtonPlacement().append(wrapper);
    }

    async function onClick(event) {
        var info = await gatherInfoObject();
        var href = convertToUrl(info);
        createClientValue(function (){
            window.open(href);
        });
    }

    function findButtonPlacement() {
        return document.querySelector('input[value="Update"]').closest('tr');
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
        var regex = /.*?\((.*)\)/;
        var input = document.querySelector('input[name="description"]');
        var matches = regex.exec(input.value);
        return matches && matches.length > 1 ? matches[1] : input.value;
    }

    async function getDescription() {
        // TODO: Figure out how to provide
        return ""
        let content = await retrieveSpecContent(getSpecUrl())
        let spec = filterConstraints(content)
        let markdown = convertToMarkdown(spec)
        return markdown
    }

    function retrieveSpecContent(url) {
        return new Promise((resolve, reject) => {
            if (typeof JiraYoutrack.fetch === 'undefined') {
                reject(null)
            }
            
            JiraYoutrack.fetch({
                method: "GET",
                url: url,
                onload: function(response) {
                    let doc = document.createElement('html')
                    doc.innerHTML = response.responseText

                    let spec = doc.querySelector('table.MessageBorder td:first-child')
                    resolve(spec)
                }
            })
        })
    }

    function filterConstraints(element) {
        var result = document.createElement('div')
        var currentIndex = 0
        var current = element.childNodes[currentIndex]
        const headings = ["H1","H2","H3","H4","H5","H6"]
        const isConstraintHeading = (elem) => { return elem.textContent.toLowerCase().includes('constraints') && headings.includes(elem.tagName) }

        while (current && !isConstraintHeading(current)) {
            result.appendChild(current.cloneNode(true))
            currentIndex++
            current = element.childNodes[currentIndex]
        }

        return result
    }

    function convertToMarkdown(element) {
        if (typeof window.TurndownService !== "undefined") {
            var converter = window.TurndownService()
            return converter.turndown(element)
        }
        return element.innerText
    }
    
    function getSpecUrl() {
        var specLink = document.querySelector('a[href*="area=projects&target=specification&"]');
        return specLink.href + "&read_only_mode=yes"
    }

    function getSpecLink() {
        var specLink = getSpecUrl()
        return specLink ? "Specification: " + specLink : "";
    }

    function getExternalLinksText() {
        return "Task: " + location.href + '\n' + getSpecLink();
    }

    function getRepoText() {
        return '';
    }

    function getAssignee() {
        var select = document.getElementById('u_id');
        var assignee = select.options[select.selectedIndex].text.split(",");
        return assignee && assignee.length > 1 ? assignee[0] : null;
    }

    function getState() {
        var select = document.getElementById('status');
        switch (select.value) {
            case 'W':
                return 'In Progress';
            case 'Q':
                return 'Quality Assurance';
            case 'E':
            case 'X':
                return 'Canceled';
            case 'V':
                return 'Waiting';
            case 'T':
                return 'Completed';
            case 'S':
            default:
                return 'Scheduled';
        }
    }
    
    function getStartDate() {
        var input = document.getElementById('date_start-data');
        return input ? formatDate(input.value) : null;
    }

    function getDueDate() {
        var input = document.getElementById('date_end-data');
        return input ? formatDate(input.value) : null;
    }

    function getVerificationDate() {
        var input = document.getElementById('verification_date-data');
        return input ? formatDate(input.value) : null;
    }

    function getEstimation() {
        var input = document.querySelector('input[name="hours"]');
        var value = parseInt(input.value);
        return value ? value + 'h' : null;
    }

    function getClient() {
        var element = document.querySelectorAll('.SubjectInfo_Light')[0];
        // Removing <span class="online_company" title="Online last hour">•</span>
        return element.innerText.replace("•", "").trim();
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
