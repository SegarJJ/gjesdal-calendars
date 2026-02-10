Feature: Download calendar file
  As a resident of Gjesdal municipality
  I want to download an .ics calendar file
  So that I can import it into my calendar application

  Background:
    Given the user has opened the Tømmekalender page

  Scenario: Download button is disabled until selections are complete
    Then the download button should be disabled

  Scenario: Download button is enabled when route and waste types are selected
    Given the user has selected "Rute 1"
    And at least one waste type is selected
    Then the download button should be enabled
    And the download button label should be "📅 Last ned kalenderfil (.ics)"

  Scenario: Downloading an ICS file
    Given the user has selected "Rute 3"
    And all waste types are selected
    When the user clicks the download button
    Then a file named "Gjesdal Tømmekalender 2026 - Rute 3.ics" should be downloaded
    And a success toast should appear with the message "Kalenderfilen er lastet ned! 📅"

  Scenario: Downloaded file name matches the selected route
    Given the user has selected "Rute 1"
    And at least one waste type is selected
    When the user clicks the download button
    Then the downloaded filename should be "Gjesdal Tømmekalender 2026 - Rute 1.ics"

  Scenario: Downloaded ICS file is valid
    Given the user has selected "Rute 3"
    And all waste types are selected
    When the user clicks the download button
    Then the downloaded file should begin with "BEGIN:VCALENDAR"
    And the downloaded file should end with "END:VCALENDAR"
    And the file should contain "VERSION:2.0"
    And the file should contain "METHOD:PUBLISH"
    And the file should contain "X-WR-CALNAME:Gjesdal Tømmekalender 2026 - Rute 3"

  Scenario: Downloaded ICS file contains correct events
    Given the user has selected "Rute 3"
    And only "Matavfall" is selected as waste type
    When the user clicks the download button
    Then the file should contain 13 VEVENT blocks
    And each VEVENT should have a DTSTART with VALUE=DATE
    And each VEVENT should have a unique UID

  Scenario: Downloaded ICS file includes alerts when configured
    Given the user has selected "Rute 3"
    And only "Matavfall" is selected as waste type
    And the "Kvelden før (kl. 18)" alert is checked
    When the user clicks the download button
    Then each VEVENT should contain a VALARM block
    And the VALARM TRIGGER should be "-PT6H"

  Scenario: Downloaded ICS file has no alerts when none configured
    Given the user has selected "Rute 3"
    And only "Matavfall" is selected as waste type
    And no alerts are selected
    When the user clicks the download button
    Then no VEVENT should contain a VALARM block
