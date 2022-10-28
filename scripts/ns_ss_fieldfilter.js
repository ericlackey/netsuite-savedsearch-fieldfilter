/*
*
* This script is injected into the site from content.js in order to access
* components of the DOM and specific NetSuite functions such as getDropdown()
*
*/

"use strict";

let showCustomBodyFields=false,
    showCustomColumnFields=false,
    showCustomFields=false,
    showRelatedTableFields=false,
    showNativeFields=false,
    searchText='',
    searchType='';

const searchTypeElement = document.getElementById('searchtype');

if (searchTypeElement) {
    searchType = searchTypeElement.value;
} else {
    const params = new Proxy(new URLSearchParams(window.location.search), {
        get: (searchParams, prop) => searchParams.get(prop),
    });
    searchType = params.searchtype;
}

// Define the Saved Search fields where we want to add filtering capability
const fieldsToFilter = "input[id^='inpt_filterfilter'],input[id^='inpt_field'],input[id^='inpt_rffield'],input[id^='inpt_fffilter'],input[id^='inpt_sort']";

// Prepare the dropdowns for Field Filter
document.querySelectorAll(fieldsToFilter).forEach((el) => {
    prepareDropdown(el);
});

// Prepare the dropdown for use with Field Filter
function prepareDropdown(fieldSelector) {

    const dropdown = getDropdown(fieldSelector);
    dropdown.buildDiv();
    const dropdownDiv = dropdown.div;
    const options = dropdownDiv.childNodes;
    
    options.forEach((opt, index) => prepareOption(opt, index, dropdown));
    
    dropdownDiv.style.width='800px';
    dropdownDiv.id = `${fieldSelector.id}_dropdown`;

    fieldSelector.setAttribute('dropdown',dropdownDiv.id);
    fieldSelector.addEventListener('click',handleNativeFieldSelectorClick);

    const fieldFilter =  document.createElement('div');
    fieldFilter.classList.add('ff_div');
    if (searchType=='Transaction') {
        fieldFilter.appendChild(getCheckboxElement('ff_show_custom_body_fields','Custom Body Fields'));
        fieldFilter.appendChild(getCheckboxElement('ff_show_custom_column_fields','Custom Column Fields'));
    } else {
        fieldFilter.appendChild(getCheckboxElement('ff_show_custom_fields','Custom Fields'));
    }
    fieldFilter.appendChild(getCheckboxElement('ff_show_related_table_fields','Related Table Fields'));
    fieldFilter.appendChild(getCheckboxElement('ff_show_native_fields','Native Fields'));
    if (searchType!='Transaction') {
        const blankSpan = document.createElement('span');
        blankSpan.classList.add('ff_fieldspan');
        blankSpan.style.pointerEvents = 'none';
        fieldFilter.appendChild();
        fieldFilter.appendChild(blankSpan);
    }
    fieldFilter.appendChild(getTextElement('ff_show_search_input'));
    dropdownDiv.insertBefore(fieldFilter,dropdownDiv.childNodes[1]);

}

function prepareOption(opt, index, dropdown) {

    if (index==0) { 
        opt.style.cssText='display:none;';
    }

    const fieldId = dropdown.valueArray[index];
    const fieldName = dropdown.textArray[index];
    let fieldType = '';
    const fieldIdPrefix = fieldId.split('_')[0].toLowerCase();

    switch(fieldIdPrefix) {
        case "custbody":
            fieldType = 'Custom Body';
            break;
        case "custcol":
            fieldType = 'Custom Column';
            break;
        case "custrecord":
            fieldType = 'Custom Field';
            break;
        default:
            fieldType = 'Native Field';
            break;
    }

    if (fieldName.endsWith('...')) {
        fieldType = 'Related Field'
    }

    let newFieldName = fieldName.replace(/\((Custom Body|Custom Column|Custom)\)/i,'');

    opt.textContent = ''; // Remove the default text for the option

    // Add element for field name
    let span = document.createElement('span');
    span.classList.add('ff_option');
    span.style.width = '35%';
    span.textContent = newFieldName;
    opt.appendChild(span);

    // Add element for field type
    span = document.createElement('span');
    span.classList.add('ff_option');
    span.style.width = '15%';
    span.textContent = fieldType;
    opt.appendChild(span);

    // Add element for field data type if available
    span = document.createElement('span');
    span.classList.add('ff_option');
    span.style.width = '15%';
    if (typeof rfTypes !== 'undefined' && rfTypes[fieldId]) {
        span.textContent = rfTypes[fieldId];
    }
    opt.appendChild(span);

    // Add element for field ID
    if (fieldType != 'Related Field') {
        span = document.createElement('span');
        span.classList.add('ff_option');
        span.style.width = '35%';
        span.textContent = fieldId.toLowerCase();
        opt.appendChild(span);
    }

    opt.setAttribute('ff_fieldtype',fieldType);
    opt.setAttribute('ff_fieldname',newFieldName);
    opt.setAttribute('ff_fieldid',fieldId);

}

// Create a text search input field on the Field Filter settings
function getTextElement(fieldId) {
    const spanElement =  document.createElement('span');
    spanElement.setAttribute('onclick','event.preventDefault();');

    const textInput =  document.createElement('input');
    textInput.classList.add('ff_textbox');
    textInput.setAttribute('id',fieldId);
    textInput.setAttribute('type','text');
    textInput.setAttribute('onmouseup','event.stopPropagation();this.focus();');
    textInput.setAttribute('onkeydown','event.stopImmediatePropagation();');
    textInput.setAttribute('onkeypress','event.stopImmediatePropagation();');
    textInput.setAttribute('onkeyup','event.stopImmediatePropagation();filterDropdowns(this.parentNode.parentNode.parentNode);');
    textInput.setAttribute('ondblclick','event.preventDefault();this.select();');

    spanElement.appendChild(textInput);

    return spanElement;
}

// Create a checkbox input field on the Field Filter settings
function getCheckboxElement(fieldId, title) {
    const spanElement =  document.createElement('span');
    spanElement.classList.add('ff_fieldspan');
    spanElement.setAttribute('onclick',`event.preventDefault();document.getElementById('${fieldId}').checked=document.getElementById('${fieldId}').checked ? false : true;filterDropdowns(this.parentNode.parentNode);`);
    spanElement.setAttribute('onpointerdown','event.preventDefault();');

    const checkboxInput =  document.createElement('input');
    checkboxInput.classList.add('ff_checkbox');
    checkboxInput.setAttribute('id',fieldId);
    checkboxInput.setAttribute('checked','');
    checkboxInput.setAttribute('type','checkbox');
    checkboxInput.setAttribute('onpointerdown','event.preventDefault();');
    checkboxInput.setAttribute('onclick',`event.stopImmediatePropagation();filterDropdowns(this.parentNode.parentNode.parentNode);`)

    spanElement.appendChild(checkboxInput);
    spanElement.appendChild(document.createTextNode(title));

    return spanElement;
}

// Automatically scroll the div window to account for the filter settings element. Otherwise, selected field gets hidden behind it.
function handleNativeFieldSelectorClick(event) {
    try {
        const dropdown = getDropdown(event.target);
        if (dropdown.currentCell) {
            const currentSelectionLocation = dropdown.currentCell.getBoundingClientRect();;
            dropdown.div.scrollBy({
                top: -40,
                behavior: 'instant'
            });
        }
    } catch (err) {
        console.error(`Error occurred while trying to find current selection for scrolling: ${err}`);
    }   
}

function filterOption(opt, index) {

    // Ignore any non-native options that were added by this extension
    if (index == 0 || opt.getAttribute('class') == 'ff_div') {
        return;
    }

    // Hide or show specific field types based on user selections
    switch(opt.getAttribute('ff_fieldtype')) {
        case 'Related Field':
            opt.style.display = showRelatedTableFields ? 'block' : 'none';
            break;
        case 'Custom Body':
            opt.style.display = showCustomBodyFields ? 'block' : 'none';
            break;
        case 'Custom Column':
            opt.style.display = showCustomColumnFields ? 'block' : 'none';
            break;
        case 'Custom Field':
            opt.style.display = showCustomFields ? 'block' : 'none';
            break;
        case 'Native Field':
            opt.style.display = showNativeFields ? 'block' : 'none';
            break;
    };

    // Search for string in option with case insensitivty (i) and all matches (g)
    const searchRegex = new RegExp(searchText, 'gi');

    // If option is already hidden we don't need to filter on search term
    if (opt.style.display == 'none') {
        return;
    }

    // If there is a search term specified
    if (searchText) {

        // Search on field name on field id
        const searchOnFieldName = opt.getAttribute('ff_fieldname').search(searchRegex);
        const searchOnFieldId = opt.getAttribute('ff_fieldid').search(searchRegex);

        // If we didn't find any matches in field name or field ID, then hide the option
        if (searchOnFieldName<0 && searchOnFieldId<0) {
            opt.style.display = 'none';
            return;
        }

    }

    opt.children[0].innerHTML = opt.getAttribute('ff_fieldname').replace(searchRegex, '<mark class="highlight">$&</mark>');
    if (opt.getAttribute('ff_fieldtype') != 'Related Field') {
        opt.children[3].innerHTML = opt.getAttribute('ff_fieldid').toLowerCase().replace(searchRegex, '<mark class="highlight">$&</mark>');        
    }

    return;

}

// Show or hide options based on current Field Filter selections
function filterDropdowns (dropdownDiv) {

    if (searchType == 'Transaction') {
        showCustomBodyFields = document.getElementById('ff_show_custom_body_fields').checked;
        showCustomColumnFields = document.getElementById('ff_show_custom_column_fields').checked;
    } else {
        showCustomFields = document.getElementById('ff_show_custom_fields').checked;
    }

    showRelatedTableFields = document.getElementById('ff_show_related_table_fields').checked;
    showNativeFields = document.getElementById('ff_show_native_fields').checked;
    searchText = document.getElementById('ff_show_search_input').value;

    dropdownDiv.childNodes.forEach((opt, index) => {
        filterOption(opt, index);
    });

    return;

}
