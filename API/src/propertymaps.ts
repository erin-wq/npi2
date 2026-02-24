export default class PropertyMaps {
    static PROPERTIES = [
        {
            label: 'NPI Last Updated',
            name: 'manobyte_npi_last_updated',
            type: 'datetime',
            fieldType: 'date',
            groupName: 'manobyte_npi',
            isContact: true,
            isCompany: true,
            formField: false
        },
        {
            label: 'NPI Last Checked',
            name: 'manobyte_npi_last_checked',
            type: 'datetime',
            fieldType: 'date',
            groupName: 'manobyte_npi',
            isContact: true,
            isCompany: true,
            formField: false
        },
        {
            label: 'NPI Number',
            name: 'manobyte_npi_number',
            type: 'string',
            fieldType: 'text',
            groupName: 'manobyte_npi',
            isContact: true,
            isCompany: true,
            formField: true
        },
        {
            label: 'NPI Run Check',
            name: 'manobyte_npi_run_check',
            type: 'bool',
            fieldType: 'booleancheckbox',
            options: [
                {
                    label: 'Yes',
                    value: true
                },
                {
                    label: 'No',
                    value: false
                },
            ],
            groupName: 'manobyte_npi',
            isContact: true,
            isCompany: true,
            formField: true
        },
        // Location address
        {
            label: 'NPI Location Address 1',
            name: 'manobyte_npi_location_address_1',
            type: 'string',
            fieldType: 'text',
            groupName: 'manobyte_npi',
            isContact: true,
            isCompany: true,
            formField: false
        },
        {
            label: 'NPI Location Address 2',
            name: 'manobyte_npi_location_address_2',
            type: 'string',
            fieldType: 'text',
            groupName: 'manobyte_npi',
            isContact: true,
            isCompany: true,
            formField: false
        },
        {
            label: 'NPI Location Address City',
            name: 'manobyte_npi_location_address_city',
            type: 'string',
            fieldType: 'text',
            groupName: 'manobyte_npi',
            isContact: true,
            isCompany: true,
            formField: false
        },
        {
            label: 'NPI Location Address State',
            name: 'manobyte_npi_location_address_state',
            type: 'string',
            fieldType: 'text',
            groupName: 'manobyte_npi',
            isContact: true,
            isCompany: true,
            formField: false
        },
        {
            label: 'NPI Location Address Zip',
            name: 'manobyte_npi_location_address_zip',
            type: 'string',
            fieldType: 'text',
            groupName: 'manobyte_npi',
            isContact: true,
            isCompany: true,
            formField: false
        },
        {
            label: 'NPI Location Address Country',
            name: 'manobyte_npi_location_address_country',
            type: 'string',
            fieldType: 'text',
            groupName: 'manobyte_npi',
            isContact: true,
            isCompany: true,
            formField: false
        },
        {
            label: 'NPI Location Address Phone',
            name: 'manobyte_npi_location_address_phone',
            type: 'string',
            fieldType: 'text',
            groupName: 'manobyte_npi',
            isContact: true,
            isCompany: true,
            formField: false
        },
        // Mailing Address
        {
            label: 'NPI Mailing Address 1',
            name: 'manobyte_npi_mailing_address_1',
            type: 'string',
            fieldType: 'text',
            groupName: 'manobyte_npi',
            isContact: true,
            isCompany: true,
            formField: false
        },
        {
            label: 'NPI Mailing Address 2',
            name: 'manobyte_npi_mailing_address_2',
            type: 'string',
            fieldType: 'text',
            groupName: 'manobyte_npi',
            isContact: true,
            isCompany: true,
            formField: false
        },
        {
            label: 'NPI Mailing Address City',
            name: 'manobyte_npi_mailing_address_city',
            type: 'string',
            fieldType: 'text',
            groupName: 'manobyte_npi',
            isContact: true,
            isCompany: true,
            formField: false
        },
        {
            label: 'NPI Mailing Address State',
            name: 'manobyte_npi_mailing_address_state',
            type: 'string',
            fieldType: 'text',
            groupName: 'manobyte_npi',
            isContact: true,
            isCompany: true,
            formField: false
        },
        {
            label: 'NPI Mailing Address Zip',
            name: 'manobyte_npi_mailing_address_zip',
            type: 'string',
            fieldType: 'text',
            groupName: 'manobyte_npi',
            isContact: true,
            isCompany: true,
            formField: false
        },
        {
            label: 'NPI Mailing Address Country',
            name: 'manobyte_npi_mailing_address_country',
            type: 'string',
            fieldType: 'text',
            groupName: 'manobyte_npi',
            isContact: true,
            isCompany: true,
            formField: false
        },
        {
            label: 'NPI Mailing Address Phone',
            name: 'manobyte_npi_mailing_address_phone',
            type: 'string',
            fieldType: 'text',
            groupName: 'manobyte_npi',
            isContact: true,
            isCompany: true,
            formField: false
        },
        // Practice Locations
        {
            label: 'NPI Practice Locations',
            name: 'manobyte_npi_practice_locations',
            type: 'string',
            fieldType: 'textarea',
            groupName: 'manobyte_npi',
            isContact: true,
            isCompany: true,
            formField: false
        },
        // Taxonomies
        {
            label: 'NPI Taxonomies',
            name: 'manobyte_npi_taxonomies',
            type: 'string',
            fieldType: 'textarea',
            groupName: 'manobyte_npi',
            isContact: true,
            isCompany: true,
            formField: false
        },
        // Identifiers
        {
            label: 'NPI Identifiers',
            name: 'manobyte_npi_identifiers',
            type: 'string',
            fieldType: 'textarea',
            groupName: 'manobyte_npi',
            isContact: true,
            isCompany: true,
            formField: false
        },
        // Endpoints
        {
            label: 'NPI Endpoints',
            name: 'manobyte_npi_endpoints',
            type: 'string',
            fieldType: 'textarea',
            groupName: 'manobyte_npi',
            isContact: true,
            isCompany: true,
            formField: false
        },
        // Other Names
        {
            label: 'NPI Other Names',
            name: 'manobyte_npi_other_names',
            type: 'string',
            fieldType: 'textarea',
            groupName: 'manobyte_npi',
            isContact: true,
            isCompany: true,
            formField: false
        },
        // No match check
        {
            label: 'NPI No Match',
            name: 'manobyte_npi_no_match',
            type: 'bool',
            fieldType: 'booleancheckbox',
            options: [
                {
                    label: 'Yes',
                    value: true
                },
                {
                    label: 'No',
                    value: false
                },
            ],
            groupName: 'manobyte_npi',
            isContact: true,
            isCompany: true,
            formField: false
        },
        // Basic contact
        {
            label: 'NPI First Name',
            name: 'manobyte_npi_first_name',
            type: 'string',
            fieldType: 'text',
            groupName: 'manobyte_npi',
            isContact: true,
            isCompany: false,
            formField: false
        },
        {
            label: 'NPI Middle Name',
            name: 'manobyte_npi_middle_name',
            type: 'string',
            fieldType: 'text',
            groupName: 'manobyte_npi',
            isContact: true,
            isCompany: false,
            formField: false
        },
        {
            label: 'NPI Last Name',
            name: 'manobyte_npi_last_name',
            type: 'string',
            fieldType: 'text',
            groupName: 'manobyte_npi',
            isContact: true,
            isCompany: false,
            formField: false
        },
        {
            label: 'NPI Credential',
            name: 'manobyte_npi_credential',
            type: 'string',
            fieldType: 'text',
            groupName: 'manobyte_npi',
            isContact: true,
            isCompany: false,
            formField: false
        },
        {
            label: 'NPI Sole Proprietor',
            name: 'manobyte_npi_sole_proprietor',
            type: 'bool',
            fieldType: 'booleancheckbox',
            options: [
                {
                    label: 'Yes',
                    value: true
                },
                {
                    label: 'No',
                    value: false
                },
            ],
            groupName: 'manobyte_npi',
            isContact: true,
            isCompany: false,
            formField: false
        },
        {
            label: 'NPI Status',
            name: 'manobyte_npi_status',
            type: 'string',
            fieldType: 'text',
            groupName: 'manobyte_npi',
            isContact: true,
            isCompany: false,
            formField: false
        },
        {
            label: 'NPI Gender',
            name: 'manobyte_npi_gender',
            type: 'string',
            fieldType: 'text',
            groupName: 'manobyte_npi',
            isContact: true,
            isCompany: false,
            formField: false
        },
        {
            label: 'NPI Name Prefix',
            name: 'manobyte_npi_name_prefix',
            type: 'string',
            fieldType: 'text',
            groupName: 'manobyte_npi',
            isContact: true,
            isCompany: false,
            formField: false
        },
        {
            label: 'NPI Name Suffix',
            name: 'manobyte_npi_name_suffix',
            type: 'string',
            fieldType: 'text',
            groupName: 'manobyte_npi',
            isContact: true,
            isCompany: false,
            formField: false
        },
        // Basic company
        {
            label: 'NPI Organization Name',
            name: 'manobyte_npi_organization_name',
            type: 'string',
            fieldType: 'text',
            groupName: 'manobyte_npi',
            isContact: false,
            isCompany: true,
            formField: false
        },
        {
            label: 'NPI Subpart',
            name: 'manobyte_npi_subpart',
            type: 'bool',
            fieldType: 'booleancheckbox',
            options: [
                {
                    label: 'Yes',
                    value: true
                },
                {
                    label: 'No',
                    value: false
                },
            ],
            groupName: 'manobyte_npi',
            isContact: false,
            isCompany: true,
            formField: false
        },
        {
            label: 'NPI Status',
            name: 'manobyte_npi_status',
            type: 'string',
            fieldType: 'text',
            groupName: 'manobyte_npi',
            isContact: false,
            isCompany: true,
            formField: false
        },
        {
            label: 'NPI Authorized Official First Name',
            name: 'manobyte_npi_authorized_official_first_name',
            type: 'string',
            fieldType: 'text',
            groupName: 'manobyte_npi',
            isContact: false,
            isCompany: true,
            formField: false
        },
        {
            label: 'NPI Authorized Official Middle Name',
            name: 'manobyte_npi_authorized_official_middle_name',
            type: 'string',
            fieldType: 'text',
            groupName: 'manobyte_npi',
            isContact: false,
            isCompany: true,
            formField: false
        },
        {
            label: 'NPI Authorized Official Last Name',
            name: 'manobyte_npi_authorized_official_last_name',
            type: 'string',
            fieldType: 'text',
            groupName: 'manobyte_npi',
            isContact: false,
            isCompany: true,
            formField: false
        },
        {
            label: 'NPI Authorized Official Phone',
            name: 'manobyte_npi_authorized_official_phone',
            type: 'string',
            fieldType: 'text',
            groupName: 'manobyte_npi',
            isContact: false,
            isCompany: true,
            formField: false
        },
        {
            label: 'NPI Authorized Official Title',
            name: 'manobyte_npi_authorized_official_title',
            type: 'string',
            fieldType: 'text',
            groupName: 'manobyte_npi',
            isContact: false,
            isCompany: true,
            formField: false
        },
        {
            label: 'NPI Authorized Official Name Prefix',
            name: 'manobyte_npi_authorized_official_name_prefix',
            type: 'string',
            fieldType: 'text',
            groupName: 'manobyte_npi',
            isContact: false,
            isCompany: true,
            formField: false
        },
        {
            label: 'NPI Authorized Official Name Suffix',
            name: 'manobyte_npi_authorized_official_name_suffix',
            type: 'string',
            fieldType: 'text',
            groupName: 'manobyte_npi',
            isContact: false,
            isCompany: true,
            formField: false
        },
        {
            label: 'NPI Authorized Official Credential',
            name: 'manobyte_npi_authorized_official_credential',
            type: 'string',
            fieldType: 'text',
            groupName: 'manobyte_npi',
            isContact: false,
            isCompany: true,
            formField: false
        },
    ]

    static CONTACT_BASIC_MAP = {
        first_name: 'manobyte_npi_first_name',
        last_name: 'manobyte_npi_last_name',
        middle_name: 'manobyte_npi_middle_name',
        credential: 'manobyte_npi_credential',
        sole_proprietor: 'manobyte_npi_sole_proprietor',
        gender: 'manobyte_npi_gender',
        status: 'manobyte_npi_status',
        name_prefix: 'manobyte_npi_name_prefix',
        name_suffix: 'manobyte_npi_name_suffix'
    }

    static COMPANY_BASIC_MAP = {
        organization_name: 'manobyte_npi_organization_name',
        organizational_subpart: 'manobyte_npi_subpart',
        status: 'manobyte_npi_status',
        authorized_official_first_name: 'manobyte_npi_authorized_official_first_name',
        authorized_official_last_name: 'manobyte_npi_authorized_official_last_name',
        authorized_official_middle_name: 'manobyte_npi_authorized_official_middle_name',
        authorized_official_telephone_number: 'manobyte_npi_authorized_official_phone',
        authorized_official_title_or_position: 'manobyte_npi_authorized_official_title',
        authorized_official_name_prefix: 'manobyte_npi_authorized_official_name_prefix',
        authorized_official_name_suffix: 'manobyte_npi_authorized_official_name_suffix',
        authorized_official_credential: 'manobyte_npi_authorized_official_credential'
    }

    static LOCATION_ADDRESS_MAP = {
        address_1: 'manobyte_npi_location_address_1',
        address_2: 'manobyte_npi_location_address_2',
        city: 'manobyte_npi_location_address_city',
        state: 'manobyte_npi_location_address_state',
        postal_code: 'manobyte_npi_location_address_zip',
        country_code: 'manobyte_npi_location_address_country',
        telephone_number: 'manobyte_npi_location_address_phone'
    }

    static MAILING_ADDRESS_MAP = {
        address_1: 'manobyte_npi_mailing_address_1',
        address_2: 'manobyte_npi_mailing_address_2',
        city: 'manobyte_npi_mailing_address_city',
        state: 'manobyte_npi_mailing_address_state',
        postal_code: 'manobyte_npi_mailing_address_zip',
        country_code: 'manobyte_npi_mailing_address_country',
        telephone_number: 'manobyte_npi_mailing_address_phone'
    }

    static TAXONOMY_FIELDS = [
        'code',
        'taxonomy_group',
        'desc',
        'state',
        'license'
    ]

    static IDENTIFIER_FIELDS = [
        'code',
        'desc',
        'issuer',
        'identifier',
        'state'
    ]

    static ENDPOINT_FIELDS = [
        'endpointTypeDescription',
        'endpoint',
        'endpointDescription',
        'address_1',
        'address_2',
        'city',
        'state',
        'postal_code',
        'country_code'
    ]

    static CONTACT_OTHER_NAME_FIELDS = [
       'type',
       'prefix',
       'first_name',
       'middle_name',
       'last_name',
       'suffix',
    ]

    static COMPANY_OTHER_NAME_FIELDS = [
        'type',
        'organization_name',
     ]

    static propertyFormatter(key, value) {
        let val = value;
        try {
            if(key == 'sole_proprietor' || 
                key == 'organizational_subpart') {
                    val = value == 'YES';
            }
        } catch(e) {

        }
        return val;
    }
}