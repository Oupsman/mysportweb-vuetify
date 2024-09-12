<script setup lang="ts">
  import { useUserStore } from '@/stores/user'
  import { useAppStore } from '@/stores/app'
  import { useVuelidate } from '@vuelidate/core'

  import { validationMixin } from 'vuelidate'
  import { sameAs } from 'vuelidate/lib/validators'

  import { ref } from 'vue'
  const userStore = useUserStore()
  const appStore = useAppStore()

  const isLoading = ref(true)
  const showPassword = ref(false)

  let userForm = {}
  let v$ = null

  const rules = computed(() => ({
    newPasswordConfirmation: {
      sameAsPassword: sameAs(computed(() => userForm.newPassword)),
    },
  }))
  const user = ref(null)
  const months = []
  for (let month = 1; month <= 12; month++) {
    months.push({ value: month, title: month.toString() })
  }

  const days = []
  for (let day = 1; day <= 31; day++) {
    days.push({ value: day, title: day.toString() })
  }

  const currentYear = new Date().getFullYear()
  const startYear = currentYear - 100
  const years: number[] = []

  for (let year = currentYear; year >= startYear; year--) {
    years.push({ value: year, title: year.toString() })
  }

  const genders = [
    { title: 'Male', value: 0 },
    { title: 'Female', value: 1 },
  ]

  const birthmonth = ref(0)
  const birthday = ref(0)
  const birthyear = ref(2000)

  const fetchUser = async () => {
    try {
      isLoading.value = true
      await userStore.getUser()
      user.value = userStore.user
      console.log('ProfileForm: ', userStore.user)
      if (userStore.user.date_of_birth !== null) {
        const date = new Date(userStore.user.date_of_birth)
        console.log('date_of_birth:', date)
        birthmonth.value = date.getMonth()
        birthday.value = date.getDay()
        birthyear.value = date.getFullYear()
        if (birthmonth.value === 0) {
          birthmonth.value = 1
        }
        if (birthday.value === 0) {
          birthday.value = 1
        }

        if (birthyear.value < 1900) {
          birthyear.value = 1980
        }
      }

      if (user.value) {
        appStore.pageTitle = user.value.username
        userForm = {
          currentPassword: '',
          newPassword: '',
          newPasswordConfirmation: '',
          birthmonth: birthmonth.value,
          birthday: birthday.value,
          birthyear: birthyear.value,
          ...userStore.user,
        }
        console.log(userForm)
        v$ = useVuelidate(rules, userForm, { $autoDirty: true })
      }
    } catch (error) {
      console.error('Error while loading user', error)
    } finally {
      isLoading.value = false
    }
  }
  onMounted(fetchUser)

  const save = async () => {
    const date_of_birth = new Date(`${birthyear.value}/${birthmonth.value}/${birthday.value}`)
    console.log(date_of_birth)
    user.value = {
      ...userForm,
    }
    await userStore.updateUser(user.value)
  }
</script>

<template>
  <div v-if="isLoading">Loading...</div>
  <div v-else-if="user">
    <v-container>
      <v-form @submit.prevent="save">
        <v-text-field
          v-model="userForm.currentPassword"
          :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
          label="Current Password"
          prepend-icon="mdi-lock"
          required
          type="password"
        />
        <v-text-field
          v-model="userForm.newPassword"
          :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
          label="New Password"
          prepend-icon="mdi-lock"
          type="password"
        />
        <v-text-field
          v-model="userForm.newPasswordConfirmation"
          :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
          label="Confirm Password"
          prepend-icon="mdi-lock"
          type="password"
          @click:append="showPassword = !showPassword"
        />
        <v-row>
          <v-select v-model="userForm.birthmonth" :items="months" label="Birth Month" />
          <v-select v-model="userForm.birthday" :items="days" label="Birth day" />
          <v-select v-model="userForm.birthyear" :items="years" label="Birth year" />
        </v-row>
        <v-select v-model="userForm.gender" :items="genders" label="Gender" />
        <v-text-field v-model="userForm.weight" label="Weight" type="number" />
        <v-text-field v-model="userForm.height" label="Height (cm)" type="number" />
        <v-text-field v-model="userForm.max_hr" label="Max HR" type="number" />
        <v-text-field v-model="userForm.security_distance" label="Security Distance (m)" type="number" />
        <v-btn color="primary" type="submit">Save</v-btn>
      </v-form>
    </v-container>
  </div>
  <div v-else>User not found</div>
</template>

<style scoped lang="sass">

</style>
