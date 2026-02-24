<template>
    <div>
        <h2>Payment</h2>
        <div v-if="status == 'active'" class="stripe-valid">
            <span class="stripe-valid-icon">
                <svg aria-hidden="true" focusable="false" data-prefix="far" data-icon="check-circle" class="svg-inline--fa fa-check-circle fa-w-16" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M256 8C119.033 8 8 119.033 8 256s111.033 248 248 248 248-111.033 248-248S392.967 8 256 8zm0 48c110.532 0 200 89.451 200 200 0 110.532-89.451 200-200 200-110.532 0-200-89.451-200-200 0-110.532 89.451-200 200-200m140.204 130.267l-22.536-22.718c-4.667-4.705-12.265-4.736-16.97-.068L215.346 303.697l-59.792-60.277c-4.667-4.705-12.265-4.736-16.97-.069l-22.719 22.536c-4.705 4.667-4.736 12.265-.068 16.971l90.781 91.516c4.667 4.705 12.265 4.736 16.97.068l172.589-171.204c4.704-4.668 4.734-12.266.067-16.971z"></path></svg>
            </span>
            <b>{{status.toUpperCase()}}</b>
        </div>
        <div v-else class="stripe-valid">
            <span class="stripe-invalid-icon">
                <svg aria-hidden="true" focusable="false" data-prefix="far" data-icon="times-circle" class="svg-inline--fa fa-times-circle fa-w-16" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm0 448c-110.5 0-200-89.5-200-200S145.5 56 256 56s200 89.5 200 200-89.5 200-200 200zm101.8-262.2L295.6 256l62.2 62.2c4.7 4.7 4.7 12.3 0 17l-22.6 22.6c-4.7 4.7-12.3 4.7-17 0L256 295.6l-62.2 62.2c-4.7 4.7-12.3 4.7-17 0l-22.6-22.6c-4.7-4.7-4.7-12.3 0-17l62.2-62.2-62.2-62.2c-4.7-4.7-4.7-12.3 0-17l22.6-22.6c4.7-4.7 12.3-4.7 17 0l62.2 62.2 62.2-62.2c4.7-4.7 12.3-4.7 17 0l22.6 22.6c4.7 4.7 4.7 12.3 0 17z"></path></svg>
            </span>
            <span>{{status.toUpperCase()}}</span>
        </div>
        <div style="margin:25px 0 25px;">Use the form below to add or edit your payment information</div>
        <div class="side-input">
            <input type="text" placeholder="First Name" v-model="formData.firstName" />
            <input type="text" placeholder="Last Name" v-model="formData.lastName" />
        </div>
        <div class="side-input">
            <input type="text" placeholder="Email" v-model="formData.email" />
            <input type="text" placeholder="Phone Number" v-model="formData.phone" />
        </div>
        <div style="margin-top:15px">
            <input type="text" placeholder="Address" v-model="formData.address" />
        </div>
        <div class="side-input">
            <input type="text" placeholder="City" v-model="formData.city" />
            <div class="side-input" style="margin-top:0">
                <input type="text" placeholder="State" v-model="formData.state" />
                <input type="text" placeholder="Zip" v-model="formData.zip" />
            </div>
        </div>
        <div style="margin-top:15px">
            <input @input="formatToCard()" type="text" placeholder="Credit Card Number" v-model="formData.cc" />
        </div>
        <div class="side-input">
            <input @input="formatToExpiration()" type="text" placeholder="Expiration MM/YY" v-model="formData.exp" />
            <input type="number" placeholder="CVC" v-model="formData.cvc" />
        </div>
        
        <button :class="disableButton ? 'disable-button' : ''" @click="submit()" class="btn">SUBMIT</button>

        <div style="margin-top:35px;text-decoration:underline"><a style="cursor:pointer" @click.prevent="() => { showConfirmDelete = true }">Cancel Subscription</a></div>

        <confirm-delete v-if="showConfirmDelete" @confirm="confirmDelete()" @cancel="() => { showConfirmDelete = false }" msg="Are you sure you would like to cancel your subscription immediately?" />
    </div>
</template>

<script lang="ts">
import Vue from 'vue';
import axios from 'axios';
import ConfirmDelete from '../components/ConfirmDelete.vue'

export default Vue.extend({
    name: 'Payment',
    components: {
        ConfirmDelete
    },
    data() {
        return {
            formData: {
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                address: '',
                city: '',
                state: '',
                zip: '',
                cc: '',
                exp: '',
                cvc: ''
            },
            status: 'Unavailable',
            active: false,
            disableButton: false,
            showConfirmDelete: false
        }
    },
    async created() {
        await this.getStatus();
        this.$store.state.routeLoaded = true;
    },
    methods: {
        async getStatus() {
            await axios.get(`${this.$store.state.apiUrl}/payment/status`)
                .then(resp => {
                    if(resp.data.status) {
                        this.status = resp.data.status;
                    }
                })
                .catch(e => {
                    console.log(e);
                })
        },
        async submit() {
            for (const key of Object.keys(this.formData)) {
                if(!this.formData[key]) {
                    alert('Please fill in all fields');
                    return;
                }
            }

            if(!this.formData.exp.includes('/')) {
                alert('Make sure the expiration is in MM/YY format');
                return;
            }

            this.disableButton = true;

            await axios.post(`${this.$store.state.apiUrl}/payment`, this.formData)
                .then(resp => {
                    this.getStatus();
                    alert('Payment has been updated!');
                })
                .catch(e => {
                    if(e.response?.data) {
                        alert(e.response?.data);
                    } else {
                        alert('There was an error');
                    }
                })

            this.disableButton = false;
        },
        formatToCard() {
            // Remove characters
            let newVal = this.formData.cc.replace(/[^0-9]/g, "");
            const input = newVal.replace(/\D/g,'');
            const first = input.substring(0,4);
            const second = input.substring(4,8);
            const third = input.substring(8,12);
            const last = input.substring(12,16);
            if(input.length < 5) newVal = first;
            else if(input.length < 9) newVal = first + '-' + second;
            else if(input.length < 13) newVal = first + '-' + second + '-' + third;
            else if(input.length >= 13) newVal = first + '-' + second + '-' + third + '-' + last;
            this.formData.cc = newVal;
        },
        formatToExpiration() {
            this.formData.exp = this.formData.exp.replace(/[^0-9/]/g, "");
        },
        async confirmDelete() {
            await axios.delete(`${this.$store.state.apiUrl}/payment`)
                .then(resp => {
                    alert('Your subscription has been cancelled');
                    this.showConfirmDelete = false;
                })
                .catch(e => {
                    if(e?.response?.data) {
                        alert(e.response.data)
                    } else {
                        alert('There was an error cancelling your subscription')
                    }
                })
        }
    }
})
</script>