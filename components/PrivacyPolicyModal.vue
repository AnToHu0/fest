<script lang="ts" setup>
const emit = defineEmits(['close']);

function closeModal() {
  emit('close');
}
</script>

<template>
  <div class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <!-- Фоновое затемнение -->
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" @click="closeModal"></div>

      <!-- Центрирование модального окна -->
      <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

      <!-- Модальное окно -->
      <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
        <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div class="sm:flex sm:items-start">
            <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                Согласие на обработку персональных данных
              </h3>
              <div class="mt-4 max-h-96 overflow-y-auto text-sm text-gray-500">
                <p class="mb-2">г. Симферополь</p>
                <p class="mb-4">Регистрируясь на сайте, (в дальнейшем именуемый «Участник»), действует по своей волей и в своем интересе, предоставляет свое согласие на обработку организаторам вайшнавских мероприятий в Крыму, (в дальнейшем именуемые «Организатор») (включая получение от и/или от любых третьих лиц, с учетом требований действующего законодательства Российской Федерации) персональных данных.</p>
                
                <p class="mb-4">Регистрируясь на сайте, Участник дает согласие на обработку своих персональных данных, принятия решений или совершения иных действий, порождающих юридические последствия в отношении Участника фестиваля или других лиц и распространяется на следующую информацию: фамилия, имя, отчество, год, месяц, дата и место рождения, адрес, семейное, социальное, имущественное положение, образование, профессия, доходы, сведения, которые характеризуют физиологические особенности человека и на основе которых можно установить его личность (биометрические персональные данные) и любая иная информация, относящаяся к личности Участника, доступная либо известная в любой конкретный момент времени ("Персональные данные"). Использование и хранение биометрических персональных данных вне информационных систем персональных данных могут осуществляться только на таких материальных носителях информации и с применением такой технологии ее хранения, которые обеспечивают защиту этих данных от неправомерного или случайного доступа к ним, уничтожения, изменения, блокирования, копирования, распространения.</p>
                
                <p class="mb-4">Регистрируясь на сайте, Участник дает согласие на обработку своих Персональных данных Организатором до истечения сроков хранения соответствующей информации или документов, содержащих вышеуказанную информацию, определяемых в соответствии с законодательством Российской Федерации, после чего может быть отозвано путем направления Организатору соответствующего письменного уведомления Участником, не менее чем за 3 (три) месяца до момента</p>
                
                <p class="mb-4">Регистрируясь на сайте, Участник дает согласие на обработку своих Персональных данных, в том числе на осуществление любых действий в отношении персональных данных Участника, которые необходимы или желаемы для организации и проведения различных культурных, религиозных и других мероприятий, включая, без ограничения: сбор, систематизацию, накопление, хранение, уточнение (обновление, изменение), использование, распространение (в том числе передача), обезличивание, блокирование, уничтожение, Персональных данных, а также осуществление любых иных действий с Персональными данными Участника фестиваля с учетом действующего законодательства.</p>
                
                <p class="mb-4">Заключая настоящий договор, Участник дает согласие на обработку своих Персональных данных Организатором с применением следующих основных способов (но, не ограничиваясь ими): автоматизированная обработка, обработка без использования средств автоматизации, хранение, запись на электронные носители и их хранение, составление перечней, ведение баз данных, маркировка.</p>
                
                <p>Регистрируясь на сайте, Участник также обязуется не разглашать сведения, содержащие персональные данные Организатора или прочих Участников ставшие ему известными в результате исполнения настоящего Договора. Участник предупрежден об ответственности за разглашение указанных сведений.</p>
              </div>
            </div>
          </div>
        </div>
        <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button 
            type="button" 
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
            @click="closeModal"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  </div>
</template> 