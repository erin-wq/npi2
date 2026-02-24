<template>
    <div class="error-msg-wrap add-users-form">
        <div class="error-msg">
            <div class="pop-up-close">
                <svg @click="() => { $emit('close') }" clip-rule="evenodd" fill-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="m12.002 2.005c5.518 0 9.998 4.48 9.998 9.997 0 5.518-4.48 9.998-9.998 9.998-5.517 0-9.997-4.48-9.997-9.998 0-5.517 4.48-9.997 9.997-9.997zm0 1.5c-4.69 0-8.497 3.807-8.497 8.497s3.807 8.498 8.497 8.498 8.498-3.808 8.498-8.498-3.808-8.497-8.498-8.497zm0 7.425 2.717-2.718c.146-.146.339-.219.531-.219.404 0 .75.325.75.75 0 .193-.073.384-.219.531l-2.717 2.717 2.727 2.728c.147.147.22.339.22.531 0 .427-.349.75-.75.75-.192 0-.384-.073-.53-.219l-2.729-2.728-2.728 2.728c-.146.146-.338.219-.53.219-.401 0-.751-.323-.751-.75 0-.192.073-.384.22-.531l2.728-2.728-2.722-2.722c-.146-.147-.219-.338-.219-.531 0-.425.346-.749.75-.749.192 0 .385.073.531.219z" fill-rule="nonzero"/></svg>
            </div>
            <h2 style="margin-bottom:10px">Add Hubspot Users</h2>
            <div class="user-line">
                <div><input style="padding:10px" @input="searchOwners()" type="text" placeholder="Search by email" v-model="searchQ" /></div>
                <div><button :class="disableButton ? 'disable-button' : ''" @click="submit()" class="btn btn-sm">Submit</button></div>
            </div>
            <div class="user-line" v-for="(owner, i) in ownersFiltered" :key="i">
                <div>{{owner.email}}</div>
                <div><input type="checkbox" v-model="owner.add" /></div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from 'vue';
import axios from 'axios';

export default Vue.extend({
    name: 'AddUsers',
    props: [ 'hubspotOwners' ],
    data() {
        return {
            disableButton: false,
            ownersAll: [],
            ownersFiltered: [],
            searchQ: ''
        }
    },
    created() {
        this.ownersAll = this.$props.hubspotOwners;
        this.ownersFiltered = this.$props.hubspotOwners;
    },
    methods: {
        async submit() {
            this.disableButton = true;

            const ownersToAdd = this.ownersAll.filter(owner => {
                return owner.add;
            })
            console.log(ownersToAdd);

            await axios.post(`${this.$store.state.apiUrl}/users`, ownersToAdd)
                .then(() => {
                    this.$emit('close');
                })
                .catch(e => {
                    alert('There was an error')
                    console.log(e);
                })

            this.disableButton = false;
        },
        searchOwners() {
            if(this.searchQ.length > 2) {
                const searchQLower = this.searchQ.toLowerCase();
                this.ownersFiltered = this.ownersAll.filter(owner => {
                    return owner.email.includes(searchQLower);
                })
            } else {
                this.ownersFiltered = this.ownersAll;
            }
        }
    }
})
</script>