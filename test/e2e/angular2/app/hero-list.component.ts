import { Component } from '@angular/core';

import { Http, Response, URLSearchParams } from '@angular/http';

@Component({
  template: `
    <h2>HEROES</h2>
    <div>{{test}}</div>
    <p>Get your heroes here</p>`
})
export class HeroListComponent {
  public test = 'empty'
  constructor(private http: Http) {
    setTimeout(() => {
      this.test = 'passed'
      console.log('timeout')
    }, 0)

    this.http.get('angular2/tsconfig.json')
      .subscribe((response) => {
        console.log('response', response)
        // return response.json();
      })
  }
}