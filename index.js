const { withUiHook, htm } = require('@zeit/integration-utils')
const fetch = require('node-fetch');
const { ZEIT_AUTH_KEY } = process.env;

const store = {
	airtableAPIKey: '',
	airtableBaseKey: '',
	airtableBaseName: '',
	formTitle: '',
	airtableFieldNames: '',
	renderDefaultContent: '',
	view: 'renderDefaultContent',
	deployedURL: '',
	isFormInvalid: false,
	isURLRendered: false,
	helpLink: "https://help.amandeep.tech"
};

const crypto = require('crypto');

let htmlFile = require('./index.html.js');
let htmlFileSha1;

async function getRecords() {
	const url = `https://api.airtable.com/v0/appqy19Yo7eJo6vqC/Artists?maxRecords=3&view=Grid%20view`;
	const response = await fetch(url, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': 'Bearer ' + 'keyDMhVqJQ9UD8ulr'
		}
	});

	if (response.status !== 200) {
		throw new Error(
			`Invalid status code while trying to deploy a new URL containing Form with Airtable Integration : ${
				response.status
			} error: ${await response.text()}`
		);
	}

	const responseJSON = await response.json();
	console.log(responseJSON);
	console.log( responseJSON.records[0].fields );

	Object.size = function(obj) {
		var size = 0, key;
    for (key in obj) {
			if (obj.hasOwnProperty(key)) size++;
    }
    return size;
	};

	// Get the size of an object
	var size = Object.size(responseJSON.records[0].fields);
	console.log( responseJSON.records[0].fields.length );

	console.log(size);

	return responseJSON;
}

async function upload() {
	const url = `https://api.zeit.co/v2/now/files`;

	htmlFile = htmlFile.replace("[airtableAPIKey]", store.airtableAPIKey);
	htmlFile = htmlFile.replace("[airtableBaseKey]", store.airtableBaseKey);
	htmlFile = htmlFile.replace("[airtableBaseName]", store.airtableBaseName);
	htmlFile = htmlFile.replace("[formTitle]", store.formTitle);
	htmlFile = htmlFile.replace("[airtableFieldNames]", store.airtableFieldNames);

	let hash = crypto.createHash('sha1');
	hash.update(htmlFile);
	htmlFileSha1 = hash.digest('hex');

	console.log(htmlFile);

	const response = await fetch(url, {
		method: 'POST',
		headers: {
			'x-now-digest': htmlFileSha1,
			'Authorization': 'Bearer ' + ZEIT_AUTH_KEY
		},
		body: htmlFile
	});

	if (response.status !== 200) {
		throw new Error(
			`Invalid status code while trying to deploy a new URL containing Form with Airtable Integration : ${
				response.status
			} error: ${await response.text()}`
		);
	}

}

async function deploy() {
	const url = `https://api.zeit.co/v9/now/deployments`;
	const response = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': 'Bearer ' + ZEIT_AUTH_KEY
		},
		body: JSON.stringify({
			"name": "zeit-airtable-form-builder",
			"version": 2,
			"files": [
				{
					"file": "index.html",
					"sha": htmlFileSha1,
					"size": htmlFile.length
				}
			]
		})
	});

	if (response.status !== 200) {
		throw new Error(
			`Invalid status code while trying to deploy a new URL containing Form with Airtable Integration : ${
				response.status
			} error: ${await response.text()}`
		);
	}

	const responseJSON = await response.json();
	return responseJSON;
}

function setFormData(clientState) {
	store.isFormInvalid = false;
	store.airtableAPIKey = clientState.airtableAPIKey;
	store.airtableBaseKey = clientState.airtableBaseKey;
	store.airtableBaseName = clientState.airtableBaseName;
	store.formTitle = clientState.formTitle;
	store.airtableFieldNames = clientState.airtableFieldNames;
}

function renderDefaultContent() {
	const errorMessage = store.isFormInvalid ? 'All fields are required' : '';
	let defaultHTMLString;

	if(store.isURLRendered) {
		defaultHTMLString = htm`
			<Box textAlign="center">
				<P>${errorMessage}</P>
				<BR />
				<Input name="formTitle" label="Form Title ...(Will appear as the Heading of your form)" value=${store.formTitle} />
				<BR />
				<Input name="airtableAPIKey" label="Airtable API Key (Get it from https://airtable.com/api)" value=${store.airtableAPIKey} />
				<BR />
				<Input name="airtableBaseKey" label="Airtable Base Key (Get it from https://airtable.com/api)" value=${store.airtableBaseKey} />
				<BR />
				<Input name="airtableBaseName" label="Airtable Base Name" value=${store.airtableBaseName} />
				<BR />
				<Button action="submit">Create Airtable Form</Button>
				<BR />
				<BR />
				<Button action="cancelEdit">Cancel</Button>
				<BR />
				<BR />
				<P>Help - <Link target="_blank" href=${store.helpLink}>${store.helpLink}</Link>
			</Box>
		`;
	} else {
		defaultHTMLString = htm`
			<Box textAlign="center">
				<P>${errorMessage}</P>
				<BR />
				<Input name="formTitle" label="Form Title" value=${store.formTitle} />
				<BR />
				<Input name="airtableAPIKey" label="Airtable API Key" value=${store.airtableAPIKey} />
				<BR />
				<Input name="airtableBaseKey" label="Airtable Base Key" value=${store.airtableBaseKey} />
				<BR />
				<Input name="airtableBaseName" label="Airtable Base Name" value=${store.airtableBaseName} />
				<BR />
				<Input name="airtableFieldNames" label="Airtable Field Names (comma separated, case-sensitive)" value=${store.airtableFieldNames} />
				<BR />
				<Button action="submit">Create Airtable Form</Button>
			</Box>
		`;
	}

	return defaultHTMLString;
}

function renderDeployedURL() {
	return htm`
		<Box textAlign="center">
			<H2>
				Congratulations 🎉!
				<BR />
				<BR />
				Your form has successfully been deployed at <Link target="_blank" href=${store.deployedURL}>${store.deployedURL}</Link>
			</H2>
		</Box>
	`;
}

module.exports = withUiHook(async ({ payload }) => {
	const {clientState, action} = payload;

	switch(action) {
		case 'submit':
				if (clientState.airtableAPIKey && clientState.airtableBaseKey && clientState.airtableBaseName && clientState.formTitle) {
					setFormData(clientState);
					store.view = 'renderDeployedURL';
					store.isURLRendered = true;
					await upload();
					const response = await deploy();
					store.deployedURL = 'https://' + response.url;
				} else {
					setFormData(clientState);
					store.view = 'renderDefaultContent';
					store.isFormInvalid = true;
				}
			break;
		case 'newDeployment':
				setFormData({
					airtableAPIKey: '',
					airtableBaseKey: '',
					airtableBaseName: '',
					formTitle: '',
				});
				store.isURLRendered = false;
				store.view = 'renderDefaultContent';
			break;
		case 'editDeployment':
				setFormData(store);
				store.view = 'renderDefaultContent';
			break;
		case 'cancelEdit':
				store.view = 'renderDeployedURL';
			break;
	}

	if (store.view === 'renderDefaultContent') {
		return renderDefaultContent();
  } else {
		return renderDeployedURL();
	}
})