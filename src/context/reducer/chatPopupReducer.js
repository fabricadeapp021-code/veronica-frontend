export const chatPopupinitStates = {
    popupMsgs: [], // Inicia vazio - mensagens serão adicionadas durante a conversa
    directMsgs: [],
};
const chatPopupReducer = (state = chatPopupinitStates, action) => {
    switch (action.type) {
        case "send_popup_msg":
            return {
                ...state,
                popupMsgs: [...state.popupMsgs, action.popupMsgs]
            };
        case "send_direct_msg":
            return {
                ...state,
                directMsgs: [...state.directMsgs, action.directMsgs]
            };
        default:
            return state;
    }
};

export default chatPopupReducer