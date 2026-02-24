<template>
    <div :class="$store.state.routeLoaded ? 'slide-up view' : 'hide'" >
        <h2 style="margin-bottom:40px">NPI Hubspot Connector Installation</h2>
        <p>Use the button below to install NPI contact and company properties:</p>
        <p><a @click.prevent="installProps()" :class="disableButton ? 'disable-button btn' : 'btn'" style="text-decoration:none;display:inline-block;margin-top:0" target="_blank">Install Properties</a></p>
        <p>
            <span v-if="installationSuccess" style="color:green">Installation was a success!</span>
            <span v-if="installationFailure" style="color: red">There was an error</span>
        </p>
        <payment style="margin-top:50px"></payment>
        <h2 style="margin-top:50px">Usage</h2>
        <p>Once you have installed the necessary properties you are ready to start generating NPI data for your contact and company records in Hubspot!</p>
        <p>The installation created many new contact and company properties in a new group called NPI - ManoByte. Feel free to rename this group if you would like.</p>
        <p>There is a checkbox property for both contact and company called NPI Run Check. You can set this property to Yes on any record to trigger the NPI lookup and property fill.</p>
        <p>You can use a workflow, hidden value on a form, or manually set this property at any time to trigger the lookup.</p>
        <p>If you need to retrigger a lookup, simply set the NPI Run Check value to No, save, then set it back to Yes. This can be done in a workflow as well.</p>
        <p>When a lookup is successful you will see all of the NPI properties filled in where there is data available.</p>
        <p>If no match is found, there is a property NPI No Match that will be set to Yes.</p>
        <p>For contacts the 3 properties used for the lookup are First Name, Last Name, and Postal Code.</p>
        <p>For companies the 2 properties used for the lookup are Company Name, and Postal Code.</p>
        <p>Be sure these properties exist on the record before running a lookup.</p>
    </div>
</template>

<script lang="ts">
import Vue from 'vue';
import axios from 'axios';
import Payment from './Payment.vue';

export default Vue.extend({
    name: 'Home',
    components: {
        Payment
    },
    data() {
        return {
            installationSuccess: false,
            installationFailure: false,
            disableButton: false
        }
    },
    created() {
        this.$store.state.routeLoaded = true;
    },
    methods: {
        async installProps() {
            this.disableButton = true;
            this.installationSuccess = false;
            this.installationFailure = false;
            await axios.get(`${this.$store.state.apiUrl}/install/properties`)
                .then(resp => {
                    this.installationSuccess = true;
                })
                .catch(e => {
                    console.log(e);
                    this.installationFailure = true;
                })
            this.disableButton = false;
        }
    }
})
</script>