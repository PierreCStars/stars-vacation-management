export type Language = 'en' | 'fr' | 'it';

export interface Translations {
  // Dashboard
  dashboard: {
    title: string;
    welcome: string;
    requestVacation: string;
    submitRequest: string;
    administration: string;
    manageRequests: string;
    viewCalendar: string;
    signOut: string;
  };
  
  // Vacation Request Form
  vacationRequest: {
    title: string;
    subtitle: string;
    startDate: string;
    endDate: string;
    company: string;
    type: string;
    reason: string;
    reasonPlaceholder: string;
    submit: string;
    submitting: string;
    success: string;
    error: string;
    required: string;
    invalidDate: string;
    endDateBeforeStart: string;
  };
  
  // Companies
  companies: {
    STARS_MC: string;
    STARS_YACHTING: string;
    STARS_REAL_ESTATE: string;
    LE_PNEU: string;
    MIDI_PNEU: string;
    STARS_AVIATION: string;
  };
  
  // Vacation Types
  vacationTypes: {
    VACATION: string;
    SICK_LEAVE: string;
    PERSONAL_DAY: string;
    OTHER: string;
  };
  
  // Status
  status: {
    PENDING: string;
    APPROVED: string;
    REJECTED: string;
  };
  
  // Admin
  admin: {
    title: string;
    subtitle: string;
    pendingRequests: string;
    reviewedRequests: string;
    noPendingRequests: string;
    noReviewedRequests: string;
    clearReviewed: string;
    clearReviewedConfirm: string;
    clearReviewedWarning: string;
    cancel: string;
    confirm: string;
    clearing: string;
    exportCSV: string;
    exporting: string;
    approve: string;
    reject: string;
    addComment: string;
    commentPlaceholder: string;
    save: string;
    saving: string;
    employee: string;
    startDate: string;
    endDate: string;
    company: string;
    type: string;
    status: string;
    reviewedBy: string;
    reviewDate: string;
    actions: string;
    viewDetails: string;
    expanded: string;
    collapsed: string;
  };
  
  // Calendar
  calendar: {
    title: string;
    openInNewTab: string;
    tryEmbedded: string;
    week: string;
    month: string;
    today: string;
    previous: string;
    next: string;
    expanded: string;
    collapsed: string;
  };
  
  // Common
  common: {
    loading: string;
    error: string;
    success: string;
    back: string;
    close: string;
    yes: string;
    no: string;
    ok: string;
    cancel: string;
    optional: string;
  };
}

const translations: Record<Language, Translations> = {
  en: {
    dashboard: {
      title: 'Stars Vacation Management',
      welcome: 'Welcome back',
      requestVacation: 'Request Vacation',
      submitRequest: 'Submit Request',
      administration: 'Administration',
      manageRequests: 'Manage Requests',
      viewCalendar: 'View Calendar',
      signOut: 'Sign Out'
    },
    vacationRequest: {
      title: 'Vacation Request Form',
      subtitle: 'Submit your vacation request for approval',
      startDate: 'Start Date',
      endDate: 'End Date',
      company: 'Company',
      type: 'Type',
      reason: 'Reason (Optional)',
      reasonPlaceholder: 'Please provide a reason for your request...',
      submit: 'Submit Request',
      submitting: 'Submitting...',
      success: 'Vacation request submitted successfully!',
      error: 'Error submitting request. Please try again.',
      required: 'This field is required',
      invalidDate: 'Please select a valid date',
      endDateBeforeStart: 'End date must be after start date'
    },
    companies: {
      STARS_MC: 'Stars MC',
      STARS_YACHTING: 'Stars Yachting',
      STARS_REAL_ESTATE: 'Stars Real Estate',
      LE_PNEU: 'Le Pneu',
      MIDI_PNEU: 'Midi Pneu',
      STARS_AVIATION: 'Stars Aviation'
    },
    vacationTypes: {
      VACATION: 'Vacation',
      SICK_LEAVE: 'Sick Leave',
      PERSONAL_DAY: 'Personal Day',
      OTHER: 'Other'
    },
    status: {
      PENDING: 'Pending',
      APPROVED: 'Approved',
      REJECTED: 'Rejected'
    },
    admin: {
      title: 'Vacation Requests Admin',
      subtitle: 'Manage and review employee vacation requests',
      pendingRequests: 'Pending Requests',
      reviewedRequests: 'Reviewed Requests',
      noPendingRequests: 'No pending requests',
      noReviewedRequests: 'No reviewed requests',
      clearReviewed: 'Clear Reviewed',
      clearReviewedConfirm: 'Clear Reviewed Requests',
      clearReviewedWarning: 'Are you sure you want to clear all reviewed vacation requests? This action cannot be undone.',
      cancel: 'Cancel',
      confirm: 'Confirm',
      clearing: 'Clearing...',
      exportCSV: '📄 Export CSV',
      exporting: 'Exporting...',
      approve: 'Approve',
      reject: 'Reject',
      addComment: 'Add Comment',
      commentPlaceholder: 'Add a comment (optional)...',
      save: 'Save',
      saving: 'Saving...',
      employee: 'Employee',
      startDate: 'Start Date',
      endDate: 'End Date',
      company: 'Company',
      type: 'Type',
      status: 'Status',
      reviewedBy: 'Reviewed By',
      reviewDate: 'Review Date',
      actions: 'Actions',
      viewDetails: 'View Details',
      expanded: 'Expanded',
      collapsed: 'Collapsed'
    },
    calendar: {
      title: 'Stars Vacation Calendar',
      openInNewTab: 'Open in New Tab',
      tryEmbedded: 'Try Embedded View',
      week: 'Week',
      month: 'Month',
      today: 'Today',
      previous: 'Previous',
      next: 'Next',
      expanded: 'Expanded',
      collapsed: 'Collapsed'
    },
    common: {
      loading: 'Loading...',
      error: 'An error occurred',
      success: 'Success',
      back: 'Back',
      close: 'Close',
      yes: 'Yes',
      no: 'No',
      ok: 'OK',
      cancel: 'Cancel',
      optional: 'Optional'
    }
  },
  fr: {
    dashboard: {
      title: 'Gestion des Congés Stars',
      welcome: 'Bon retour',
      requestVacation: 'Demander un Congé',
      submitRequest: 'Soumettre la Demande',
      administration: 'Administration',
      manageRequests: 'Gérer les Demandes',
      viewCalendar: 'Voir le Calendrier',
      signOut: 'Se Déconnecter'
    },
    vacationRequest: {
      title: 'Formulaire de Demande de Congé',
      subtitle: 'Soumettez votre demande de congé pour approbation',
      startDate: 'Date de Début',
      endDate: 'Date de Fin',
      company: 'Société',
      type: 'Type',
      reason: 'Raison (Optionnel)',
      reasonPlaceholder: 'Veuillez fournir une raison pour votre demande...',
      submit: 'Soumettre la Demande',
      submitting: 'Soumission en cours...',
      success: 'Demande de congé soumise avec succès !',
      error: 'Erreur lors de la soumission. Veuillez réessayer.',
      required: 'Ce champ est obligatoire',
      invalidDate: 'Veuillez sélectionner une date valide',
      endDateBeforeStart: 'La date de fin doit être après la date de début'
    },
    companies: {
      STARS_MC: 'Stars MC',
      STARS_YACHTING: 'Stars Yachting',
      STARS_REAL_ESTATE: 'Stars Real Estate',
      LE_PNEU: 'Le Pneu',
      MIDI_PNEU: 'Midi Pneu',
      STARS_AVIATION: 'Stars Aviation'
    },
    vacationTypes: {
      VACATION: 'Congé',
      SICK_LEAVE: 'Congé Maladie',
      PERSONAL_DAY: 'Jour Personnel',
      OTHER: 'Autre'
    },
    status: {
      PENDING: 'En Attente',
      APPROVED: 'Approuvé',
      REJECTED: 'Rejeté'
    },
    admin: {
      title: 'Administration des Demandes de Congé',
      subtitle: 'Gérer et examiner les demandes de congé des employés',
      pendingRequests: 'Demandes en Attente',
      reviewedRequests: 'Demandes Examinées',
      noPendingRequests: 'Aucune demande en attente',
      noReviewedRequests: 'Aucune demande examinée',
      clearReviewed: 'Effacer les Examinées',
      clearReviewedConfirm: 'Effacer les Demandes Examinées',
      clearReviewedWarning: 'Êtes-vous sûr de vouloir effacer toutes les demandes de congé examinées ? Cette action ne peut pas être annulée.',
      cancel: 'Annuler',
      confirm: 'Confirmer',
      clearing: 'Effacement...',
      exportCSV: '📄 Exporter CSV',
      exporting: 'Exportation...',
      approve: 'Approuver',
      reject: 'Rejeter',
      addComment: 'Ajouter un Commentaire',
      commentPlaceholder: 'Ajouter un commentaire (optionnel)...',
      save: 'Enregistrer',
      saving: 'Enregistrement...',
      employee: 'Employé',
      startDate: 'Date de Début',
      endDate: 'Date de Fin',
      company: 'Société',
      type: 'Type',
      status: 'Statut',
      reviewedBy: 'Examiné Par',
      reviewDate: 'Date d\'Examen',
      actions: 'Actions',
      viewDetails: 'Voir les Détails',
      expanded: 'Développé',
      collapsed: 'Réduit'
    },
    calendar: {
      title: 'Calendrier des Congés Stars',
      openInNewTab: 'Ouvrir dans un Nouvel Onglet',
      tryEmbedded: 'Essayer la Vue Intégrée',
      week: 'Semaine',
      month: 'Mois',
      today: 'Aujourd\'hui',
      previous: 'Précédent',
      next: 'Suivant',
      expanded: 'Développé',
      collapsed: 'Réduit'
    },
    common: {
      loading: 'Chargement...',
      error: 'Une erreur s\'est produite',
      success: 'Succès',
      back: 'Retour',
      close: 'Fermer',
      yes: 'Oui',
      no: 'Non',
      ok: 'OK',
      cancel: 'Annuler',
      optional: 'Optionnel'
    }
  },
  it: {
    dashboard: {
      title: 'Gestione Ferie Stars',
      welcome: 'Bentornato',
      requestVacation: 'Richiedi Ferie',
      submitRequest: 'Invia Richiesta',
      administration: 'Amministrazione',
      manageRequests: 'Gestisci Richieste',
      viewCalendar: 'Visualizza Calendario',
      signOut: 'Disconnetti'
    },
    vacationRequest: {
      title: 'Modulo Richiesta Ferie',
      subtitle: 'Invia la tua richiesta di ferie per l\'approvazione',
      startDate: 'Data di Inizio',
      endDate: 'Data di Fine',
      company: 'Azienda',
      type: 'Tipo',
      reason: 'Motivo (Opzionale)',
      reasonPlaceholder: 'Fornisci un motivo per la tua richiesta...',
      submit: 'Invia Richiesta',
      submitting: 'Invio in corso...',
      success: 'Richiesta di ferie inviata con successo!',
      error: 'Errore nell\'invio. Riprova.',
      required: 'Questo campo è obbligatorio',
      invalidDate: 'Seleziona una data valida',
      endDateBeforeStart: 'La data di fine deve essere successiva alla data di inizio'
    },
    companies: {
      STARS_MC: 'Stars MC',
      STARS_YACHTING: 'Stars Yachting',
      STARS_REAL_ESTATE: 'Stars Real Estate',
      LE_PNEU: 'Le Pneu',
      MIDI_PNEU: 'Midi Pneu',
      STARS_AVIATION: 'Stars Aviation'
    },
    vacationTypes: {
      VACATION: 'Ferie',
      SICK_LEAVE: 'Malattia',
      PERSONAL_DAY: 'Giorno Personale',
      OTHER: 'Altro'
    },
    status: {
      PENDING: 'In Attesa',
      APPROVED: 'Approvato',
      REJECTED: 'Rifiutato'
    },
    admin: {
      title: 'Amministrazione Richieste Ferie',
      subtitle: 'Gestisci e esamina le richieste di ferie dei dipendenti',
      pendingRequests: 'Richieste in Attesa',
      reviewedRequests: 'Richieste Esaminate',
      noPendingRequests: 'Nessuna richiesta in attesa',
      noReviewedRequests: 'Nessuna richiesta esaminata',
      clearReviewed: 'Cancella Esaminate',
      clearReviewedConfirm: 'Cancella Richieste Esaminate',
      clearReviewedWarning: 'Sei sicuro di voler cancellare tutte le richieste di ferie esaminate? Questa azione non può essere annullata.',
      cancel: 'Annulla',
      confirm: 'Conferma',
      clearing: 'Cancellazione...',
      exportCSV: '📄 Esporta CSV',
      exporting: 'Esportazione...',
      approve: 'Approva',
      reject: 'Rifiuta',
      addComment: 'Aggiungi Commento',
      commentPlaceholder: 'Aggiungi un commento (opzionale)...',
      save: 'Salva',
      saving: 'Salvataggio...',
      employee: 'Dipendente',
      startDate: 'Data di Inizio',
      endDate: 'Data di Fine',
      company: 'Azienda',
      type: 'Tipo',
      status: 'Stato',
      reviewedBy: 'Esaminato Da',
      reviewDate: 'Data di Esame',
      actions: 'Azioni',
      viewDetails: 'Visualizza Dettagli',
      expanded: 'Espanso',
      collapsed: 'Comprimit'
    },
    calendar: {
      title: 'Calendario Ferie Stars',
      openInNewTab: 'Apri in Nuova Scheda',
      tryEmbedded: 'Prova Vista Incorporata',
      week: 'Settimana',
      month: 'Mese',
      today: 'Oggi',
      previous: 'Precedente',
      next: 'Successivo',
      expanded: 'Espanso',
      collapsed: 'Compattato'
    },
    common: {
      loading: 'Caricamento...',
      error: 'Si è verificato un errore',
      success: 'Successo',
      back: 'Indietro',
      close: 'Chiudi',
      yes: 'Sì',
      no: 'No',
      ok: 'OK',
      cancel: 'Annulla',
      optional: 'Opzionale'
    }
  }
};

export function getTranslations(language: Language): Translations {
  return translations[language] || translations.en;
}

export function getLanguageFromLocale(locale: string): Language {
  switch (locale.toLowerCase()) {
    case 'fr':
    case 'fr-fr':
    case 'fr-ca':
      return 'fr';
    case 'it':
    case 'it-it':
    case 'it-ch':
      return 'it';
    default:
      return 'en';
  }
}

export function getLanguageName(language: Language): string {
  switch (language) {
    case 'en':
      return 'English';
    case 'fr':
      return 'Français';
    case 'it':
      return 'Italiano';
    default:
      return 'English';
  }
}

export function getLanguageFlag(language: Language): string {
  switch (language) {
    case 'en':
      return '🇺🇸';
    case 'fr':
      return '🇫🇷';
    case 'it':
      return '🇮🇹';
    default:
      return '🇺🇸';
  }
} 