import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { get } from 'lodash';

@Component({
  standalone: false,
  selector: 'app-dsr-unauthorized',
  templateUrl: './dsr-unauthorized.component.html',
  styleUrls: ['./dsr-unauthorized.component.scss']
})
export class DsrUnauthorizedComponent implements OnInit {
  /** The URL the user attempted to reach before being blocked. */
  attemptedUrl: string | null = null;

  constructor(private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.attemptedUrl = get(this.route.snapshot, 'queryParams.returnUrl', null);
  }
}
