/*
*
* This script is injected into the site from content.js in order to access
* components of the DOM and specific NetSuite functions such as getDropdown()
*
*/

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
    
    options.forEach((opt, index) => {
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
        opt.innerHTML = `
            <span class="ff_option" style="width:35%;">${newFieldName}</span>
            <span class="ff_option" style="width:15%;">${fieldType}</span>
        `;
        if (typeof rfTypes !== 'undefined' && rfTypes[fieldId]) {
            opt.innerHTML += `<span class="ff_option" style="width:15%;">${rfTypes[fieldId]}</span>`
        } else {
            opt.innerHTML += `<span class="ff_option" style="width:15%;"></span>`
        }
        if (fieldType != 'Related Field') {
            opt.innerHTML += `<span class="ff_option" style="width:35%;">${fieldId.toLowerCase()}</span>`
        }

        opt.setAttribute('ff_fieldtype',fieldType);
        opt.setAttribute('ff_fieldname',newFieldName);
        opt.setAttribute('ff_fieldid',fieldId);

    });
    
    dropdownDiv.style.width='800px';
    dropdownDiv.id = `${fieldSelector.id}_dropdown`;

    fieldSelector.setAttribute('dropdown',dropdownDiv.id);
    fieldSelector.addEventListener('click',handleFieldSelectorClick);

    const fieldFilter =  document.createElement('div');
    fieldFilter.classList.add('ff_div');
    if (searchType=='Transaction') {
        fieldFilter.innerHTML = `<span class="ff_fieldspan" onclick="event.preventDefault();handleSpanClick('ff_show_custom_body_fields');filterDropdowns(${dropdownDiv.id});" onpointerdown="event.preventDefault();"><input class="ff_checkbox" type="checkbox" id="ff_show_custom_body_fields" checked onpointerdown="event.preventDefault();" onclick="event.stopImmediatePropagation();filterDropdowns(${dropdownDiv.id});"/> Custom Body Fields</span>`;
        fieldFilter.innerHTML += `<span class="ff_fieldspan" onclick="event.preventDefault();handleSpanClick('ff_show_custom_column_fields');filterDropdowns(${dropdownDiv.id});" onpointerdown="event.preventDefault();"><input class="ff_checkbox" type="checkbox" id="ff_show_custom_column_fields" checked onpointerdown="event.preventDefault();" onclick="event.stopImmediatePropagation();filterDropdowns(${dropdownDiv.id});"/> Custom Column Fields</span>`;
    } else {
        fieldFilter.innerHTML += `<span class="ff_fieldspan" onclick="event.preventDefault();handleSpanClick('ff_show_custom_fields');filterDropdowns(${dropdownDiv.id});" onpointerdown="event.preventDefault();"><input class="ff_checkbox" type="checkbox" id="ff_show_custom_fields" checked onpointerdown="event.preventDefault();" onclick="event.stopImmediatePropagation();filterDropdowns(${dropdownDiv.id});"/> Custom Fields</span>`;
    }
    fieldFilter.innerHTML += `<span class="ff_fieldspan" onclick="event.preventDefault();handleSpanClick('ff_show_related_table_fields');filterDropdowns(${dropdownDiv.id});" onpointerdown="event.preventDefault();"><input class="ff_checkbox" type="checkbox" id="ff_show_related_table_fields" checked onpointerdown="event.preventDefault();" onclick="event.stopImmediatePropagation();filterDropdowns(${dropdownDiv.id});"/> Related Table Fields</span>`;
    fieldFilter.innerHTML += `<span class="ff_fieldspan" onclick="event.preventDefault();handleSpanClick('ff_show_native_fields');filterDropdowns(${dropdownDiv.id});" onpointerdown="event.preventDefault();"><input class="ff_checkbox" type="checkbox" id="ff_show_native_fields" checked onpointerdown="event.preventDefault();" onclick="event.stopImmediatePropagation();filterDropdowns(${dropdownDiv.id});"/> Native Fields</span>`;
    if (searchType!='Transaction') {
        fieldFilter.innerHTML += `<span class="ff_fieldspan" style="pointer-events:none;"></span>`
    }
    fieldFilter.innerHTML += `<span onclick="event.preventDefault();"><input class="ff_textbox" type="text" id="ff_show_search_input" value="" onmouseup="event.stopPropagation();this.focus();"  onkeydown="event.stopImmediatePropagation();" onkeypress="event.stopImmediatePropagation();" onkeyup="event.stopImmediatePropagation();filterDropdowns(${dropdownDiv.id});" ondblclick="event.preventDefault();this.select();"></span>`;
    dropdownDiv.insertBefore(fieldFilter,dropdownDiv.childNodes[1]);

    /*
    const fieldFilterFooter =  document.createElement('div');
    fieldFilterFooter.setAttribute('id','ff_footer');
    fieldFilterFooter.classList.add('ff_div_footer');
    fieldFilterFooter.textContent='Field Filter 0.4';
    dropdownDiv.appendChild(fieldFilterFooter);
    */


}

// Automatically scroll the div window to account for the filter settings element. Otherwise, selected field gets hidden behind it.
function handleFieldSelectorClick(event) {
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

// Handles when a user clicks on the span containing the checkbox instead of the actual checkbox
function handleSpanClick(checkboxId) {
    const checkbox = document.getElementById(checkboxId);
    checkbox.checked = checkbox.checked ? false : true;
    return;
}

// Show or hide options based on current Field Filter selections
function filterDropdowns (dropdownDiv) {

    let showCustomBodyFields,
        showCustomColumnFields,
        showCustomFields,
        showRelatedTableFields,
        showNativeFields,
        searchInputField

    if (searchType == 'Transaction') {
        showCustomBodyFields = document.getElementById('ff_show_custom_body_fields');
        showCustomColumnFields = document.getElementById('ff_show_custom_column_fields');
    } else {
        showCustomFields = document.getElementById('ff_show_custom_fields');
    }

    showRelatedTableFields = document.getElementById('ff_show_related_table_fields');
    showNativeFields = document.getElementById('ff_show_native_fields');
    searchInputField = document.getElementById('ff_show_search_input');

    dropdownDiv.childNodes.forEach((opt, index) => {

        if (index == 0) {
            return true;
        }

        // Filter by field type
        switch(opt.getAttribute('ff_fieldtype')) {
            case 'Related Field':
                opt.style.display = showRelatedTableFields.checked ? 'block' : 'none';
                break;
            case 'Custom Body':
                opt.style.display = showCustomBodyFields.checked ? 'block' : 'none';
                break;
            case 'Custom Column':
                opt.style.display = showCustomColumnFields.checked ? 'block' : 'none';
                break;
            case 'Custom Field':
                opt.style.display = showCustomFields.checked ? 'block' : 'none';
                break;
            case 'Native Field':
                opt.style.display = showNativeFields.checked ? 'block' : 'none';
                break;
        };

        if (opt.getAttribute('class') == 'ff_div') {
            return true;
        }

        const searchText = searchInputField.value;

        const searchRegex = new RegExp(searchText, 'gi');

        if (opt.style.display == 'block'
            && opt.getAttribute('ff_fieldname').search(searchRegex)==-1
            && opt.getAttribute('ff_fieldid').search(searchRegex)==-1) {
            opt.style.display = 'none';
        }

        if (opt.style.display != 'none') {
            if (searchText != '') {
                const newFieldNameHTML = opt.getAttribute('ff_fieldname').replace(searchRegex, '<mark class="highlight">$&</mark>');
                opt.children[0].innerHTML = newFieldNameHTML;
                if (opt.getAttribute('ff_fieldtype') != 'Related Field') {
                    const newFieldIdHTML = opt.getAttribute('ff_fieldid').toLowerCase().replace(searchRegex, '<mark class="highlight">$&</mark>');
                    opt.children[3].innerHTML = newFieldIdHTML;
                }
            } else {
                opt.children[0].innerHTML = opt.getAttribute('ff_fieldname');
                if (opt.getAttribute('ff_fieldtype') != 'Related Field') {
                    opt.children[3].innerHTML = opt.getAttribute('ff_fieldid').toLowerCase();
                }
            }
        }

        /*
        if (opt.style.display == 'block') {
            fieldsShowing++;
        }

        ff_footer.textContent = `Found ${fieldsShowing} fields`;
        */

    });

    return true;

}
