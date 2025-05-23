// EventRegistration.js - Component for registering to events
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://lkgqmfqtxpbvwrsguwka.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrZ3FtZnF0eHBidndyc2d1d2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1ODk1MjYsImV4cCI6MjA2MzE2NTUyNn0.bMKMVLW-dwVDfhXFIBr-dxbB9yFZ-isNb5v2VrjoqQA';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

class EventRegistration {
  /**
   * Initialize the EventRegistration component
   * @param {string} containerId - The ID of the container element to render the registration form
   * @param {string} eventId - The ID of the event to register for
   */
  constructor(containerId, eventId) {
    this.containerId = containerId;
    this.eventId = eventId;
    this.containerElement = document.getElementById(containerId);
    
    if (!this.containerElement) {
      console.error(`Container element with ID "${containerId}" not found`);
      return;
    }
    
    // Check if user is logged in
    this.checkAuthStatus();
  }
  
  /**
   * Check if the user is logged in and render appropriate content
   */
  async checkAuthStatus() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        this.user = session.user;
        // Check if the user is already registered for this event
        this.checkRegistrationStatus();
      } else {
        this.renderLoginRequired();
      }
    } catch (error) {
      console.error('Error checking authentication status:', error);
      this.renderError('An error occurred while checking authentication status');
    }
  }
  
  /**
   * Check if the user is already registered for the event
   */
  async checkRegistrationStatus() {
    try {
      // First, check if event exists and is valid
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', this.eventId)
        .single();
        
      if (eventError) {
        console.error('Error fetching event:', eventError);
        this.renderError('Event not found');
        return;
      }
      
      this.event = eventData;
      
      // Check if event is already in the past
      const currentDate = new Date();
      const eventEndDate = new Date(this.event.end_date);
      
      if (eventEndDate < currentDate) {
        this.renderPastEvent();
        return;
      }
      
      // Check if registration deadline has passed
      if (this.event.registration_deadline) {
        const deadlineDate = new Date(this.event.registration_deadline);
        if (deadlineDate < currentDate) {
          this.renderDeadlinePassed();
          return;
        }
      }
      
      // Check if event is canceled
      if (this.event.status === 'canceled') {
        this.renderCanceledEvent();
        return;
      }
      
      // Check if user is already registered
      const { data: registrationData, error: registrationError } = await supabase
        .from('event_registrations')
        .select('id, status')
        .eq('event_id', this.eventId)
        .eq('user_id', this.user.id)
        .single();
        
      if (registrationError && registrationError.code !== 'PGRST116') {
        console.error('Error checking registration status:', registrationError);
        this.renderError('An error occurred while checking registration status');
        return;
      }
      
      if (registrationData) {
        // User is already registered
        this.renderAlreadyRegistered(registrationData.status);
      } else {
        // User is not registered yet
        this.renderRegistrationForm();
      }
    } catch (error) {
      console.error('Error checking registration status:', error);
      this.renderError('An error occurred while checking registration status');
    }
  }
  
  /**
   * Render the registration form
   */
  renderRegistrationForm() {
    const formHtml = `
      <div class="event-registration-form">
        <h3>Register for ${this.event.title}</h3>
        <p>Please fill out the form below to register for this event.</p>
        
        <form id="${this.containerId}-form">
          <div class="form-group mb-3">
            <label for="notes">Any special requests or notes:</label>
            <textarea id="${this.containerId}-notes" class="form-control" rows="3"></textarea>
          </div>
          
          <div class="alert alert-info">
            By registering, you agree to attend this event.
          </div>
          
          <button type="submit" class="btn btn-theme effect btn-sm">Register Now</button>
        </form>
      </div>
    `;
    
    this.containerElement.innerHTML = formHtml;
    
    // Add event listener to the form
    const form = document.getElementById(`${this.containerId}-form`);
    form.addEventListener('submit', this.handleRegister.bind(this));
  }
  
  /**
   * Handle the registration form submission
   * @param {Event} event - The form submission event
   */
  async handleRegister(event) {
    event.preventDefault();
    
    const notesElement = document.getElementById(`${this.containerId}-notes`);
    const notes = notesElement ? notesElement.value : '';
    
    try {
      // Register the user for the event
      const { data, error } = await supabase
        .from('event_registrations')
        .insert([
          {
            event_id: this.eventId,
            user_id: this.user.id,
            notes: notes
          }
        ])
        .select();
        
      if (error) {
        console.error('Error registering for event:', error);
        this.renderError('An error occurred while registering for the event');
        return;
      }
      
      // Registration successful
      this.renderSuccessMessage();
    } catch (error) {
      console.error('Error registering for event:', error);
      this.renderError('An error occurred while registering for the event');
    }
  }
  
  /**
   * Render a success message after registration
   */
  renderSuccessMessage() {
    const successHtml = `
      <div class="event-registration-success">
        <div class="alert alert-success">
          <h4>Registration Successful!</h4>
          <p>You have successfully registered for ${this.event.title}.</p>
          <p>Please check your email for confirmation details.</p>
        </div>
        
        <div class="text-center">
          <button id="${this.containerId}-cancel" class="btn btn-danger btn-sm">Cancel Registration</button>
        </div>
      </div>
    `;
    
    this.containerElement.innerHTML = successHtml;
    
    // Add event listener to the cancel button
    const cancelButton = document.getElementById(`${this.containerId}-cancel`);
    cancelButton.addEventListener('click', this.handleCancel.bind(this));
  }
  
  /**
   * Handle cancellation of registration
   */
  async handleCancel() {
    try {
      // Update the registration status to canceled
      const { error } = await supabase
        .from('event_registrations')
        .update({ status: 'canceled' })
        .eq('event_id', this.eventId)
        .eq('user_id', this.user.id);
        
      if (error) {
        console.error('Error canceling registration:', error);
        this.renderError('An error occurred while canceling your registration');
        return;
      }
      
      // Show canceled message
      this.renderCancelationSuccess();
    } catch (error) {
      console.error('Error canceling registration:', error);
      this.renderError('An error occurred while canceling your registration');
    }
  }
  
  /**
   * Render a message when the user is already registered
   * @param {string} status - The current registration status
   */
  renderAlreadyRegistered(status) {
    let statusMessage = '';
    let showCancelButton = false;
    
    switch (status) {
      case 'registered':
        statusMessage = 'You are registered for this event.';
        showCancelButton = true;
        break;
      case 'attended':
        statusMessage = 'You have attended this event.';
        break;
      case 'canceled':
        statusMessage = 'You have canceled your registration for this event.';
        break;
      case 'no-show':
        statusMessage = 'You were marked as a no-show for this event.';
        break;
      default:
        statusMessage = 'You are registered for this event.';
        showCancelButton = true;
    }
    
    const registeredHtml = `
      <div class="event-registration-status">
        <div class="alert alert-info">
          <h4>Registration Status</h4>
          <p>${statusMessage}</p>
        </div>
        
        ${showCancelButton ? `
          <div class="text-center">
            <button id="${this.containerId}-cancel" class="btn btn-danger btn-sm">Cancel Registration</button>
          </div>
        ` : ''}
      </div>
    `;
    
    this.containerElement.innerHTML = registeredHtml;
    
    // Add event listener to the cancel button if shown
    if (showCancelButton) {
      const cancelButton = document.getElementById(`${this.containerId}-cancel`);
      cancelButton.addEventListener('click', this.handleCancel.bind(this));
    }
  }
  
  /**
   * Render a success message after cancellation
   */
  renderCancelationSuccess() {
    const cancelHtml = `
      <div class="event-registration-canceled">
        <div class="alert alert-success">
          <h4>Registration Canceled</h4>
          <p>Your registration for ${this.event.title} has been canceled.</p>
        </div>
        
        <div class="text-center">
          <button id="${this.containerId}-register-again" class="btn btn-theme effect btn-sm">Register Again</button>
        </div>
      </div>
    `;
    
    this.containerElement.innerHTML = cancelHtml;
    
    // Add event listener to the register again button
    const registerAgainButton = document.getElementById(`${this.containerId}-register-again`);
    registerAgainButton.addEventListener('click', this.checkRegistrationStatus.bind(this));
  }
  
  /**
   * Render a login required message
   */
  renderLoginRequired() {
    const loginHtml = `
      <div class="event-registration-login-required">
        <div class="alert alert-warning">
          <h4>Login Required</h4>
          <p>You need to be logged in to register for this event.</p>
        </div>
        
        <div class="text-center">
          <a href="/login.html" class="btn btn-theme effect btn-sm">Login</a>
          <a href="/registration.html" class="btn btn-secondary btn-sm">Register</a>
        </div>
      </div>
    `;
    
    this.containerElement.innerHTML = loginHtml;
  }
  
  /**
   * Render an error message
   * @param {string} message - The error message to display
   */
  renderError(message) {
    const errorHtml = `
      <div class="event-registration-error">
        <div class="alert alert-danger">
          <h4>Error</h4>
          <p>${message}</p>
        </div>
      </div>
    `;
    
    this.containerElement.innerHTML = errorHtml;
  }
  
  /**
   * Render a message when the event is in the past
   */
  renderPastEvent() {
    const pastEventHtml = `
      <div class="event-registration-past">
        <div class="alert alert-warning">
          <h4>Event Has Ended</h4>
          <p>This event has already ended and registration is closed.</p>
        </div>
      </div>
    `;
    
    this.containerElement.innerHTML = pastEventHtml;
  }
  
  /**
   * Render a message when the registration deadline has passed
   */
  renderDeadlinePassed() {
    const deadlineHtml = `
      <div class="event-registration-deadline">
        <div class="alert alert-warning">
          <h4>Registration Closed</h4>
          <p>The registration deadline for this event has passed.</p>
        </div>
      </div>
    `;
    
    this.containerElement.innerHTML = deadlineHtml;
  }
  
  /**
   * Render a message when the event is canceled
   */
  renderCanceledEvent() {
    const canceledHtml = `
      <div class="event-registration-canceled">
        <div class="alert alert-danger">
          <h4>Event Canceled</h4>
          <p>This event has been canceled.</p>
        </div>
      </div>
    `;
    
    this.containerElement.innerHTML = canceledHtml;
  }
}

// Export the class for use in other files
window.EventRegistration = EventRegistration; 